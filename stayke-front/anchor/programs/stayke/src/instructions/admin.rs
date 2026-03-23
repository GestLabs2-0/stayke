use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    errors::StaykeErrors,
    state::{PenaltySeverity, PlatformConfig, UserProfile, MAX_ADMINS},
};

// ---------------------------------------------------------------------------
// Add / Remove admin
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct AddRemoveAdmin<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        constraint = config.admins.contains(&signer.key()) @ StaykeErrors::UnauthorizedAdmin,
        bump = config.bump,
    )]
    pub config: Account<'info, PlatformConfig>,
}

pub fn ins_add_admin(ctx: Context<AddRemoveAdmin>, new_admin: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require!(
        config.admins.len() < MAX_ADMINS,
        StaykeErrors::MaxAdminsReached
    );

    if !config.admins.contains(&new_admin) {
        config.admins.push(new_admin);
    }

    Ok(())
}

pub fn ins_remove_admin(ctx: Context<AddRemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require!(
        admin_to_remove != ctx.accounts.signer.key(),
        StaykeErrors::CannotRemoveSelf
    );

    require!(
        config.admins.len() > 1,
        StaykeErrors::AtLeastOneAdminRequired
    );

    if let Some(pos) = config.admins.iter().position(|x| *x == admin_to_remove) {
        config.admins.remove(pos);
    } else {
        return err!(StaykeErrors::AdminNotFound);
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Verify identity  (Civic-ready stub)
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct VerifyIdentity<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"config"],
        constraint = config.admins.contains(&signer.key()) @ StaykeErrors::UnauthorizedAdmin,
        bump = config.bump,
    )]
    pub config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Reserved for future Civic Gateway Token integration.
    /// When Civic is live, this account will be validated against the
    /// user's wallet using the civic-gateway program CPI.
    pub gateway_token: UncheckedAccount<'info>,
}

pub fn ins_verify_identity(ctx: Context<VerifyIdentity>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;

    require!(!user_profile.is_verified, StaykeErrors::AlreadyVerified);

    // TODO: When integrating Civic Gateway, add a CPI call here to validate
    // `gateway_token` against `user_profile.owner` using the civic-gateway program.
    // Example (pseudocode):
    //   civic_gateway::cpi::verify(cpi_ctx)?;

    user_profile.is_verified = true;

    Ok(())
}

// ---------------------------------------------------------------------------
// Penalize user
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct PenalizeUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"config"],
        constraint = config.admins.contains(&signer.key()) @ StaykeErrors::UnauthorizedAdmin,
        bump = config.bump,
    )]
    pub config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        constraint = !penalized_profile.is_banned @ StaykeErrors::UserBanned
    )]
    pub penalized_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = affected_wallet,
    )]
    pub affected_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Wallet of the affected user — used only as authority reference for the ATA.
    pub affected_wallet: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = treasury_token_account.key() == config.treasury @ StaykeErrors::InvalidTreasuryAccount,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Treasury PDA — signs the CPI transfer.
    #[account(seeds = [b"treasury"], bump = config.treasury_bump)]
    pub treasury_pda: UncheckedAccount<'info>,

    #[account(mut, constraint = mint.key() == config.usdc_mint @ StaykeErrors::InvalidTokenMint)]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
}

pub fn ins_penalize_user(ctx: Context<PenalizeUser>, severity: PenaltySeverity) -> Result<()> {
    let config = &ctx.accounts.config;
    let penalized = &mut ctx.accounts.penalized_profile;

    // Determine retribution amount from severity
    let bps = match severity {
        PenaltySeverity::Low => config.retribution_bps_low,
        PenaltySeverity::Medium => config.retribution_bps_medium,
        PenaltySeverity::High => config.retribution_bps_high,
    };

    let retribution = (penalized.deposit as u128)
        .saturating_mul(bps as u128)
        .saturating_div(10_000) as u64;

    // If deposit can't cover the full retribution, take what's available
    let actual_retribution = retribution.min(penalized.deposit);

    // Transfer from treasury PDA to the affected party
    if actual_retribution > 0 {
        let treasury_seeds: &[&[&[u8]]] = &[&[b"treasury", &[config.treasury_bump]]];
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.affected_token_account.to_account_info(),
            authority: ctx.accounts.treasury_pda.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            cpi_accounts,
            &treasury_seeds,
        );
        token_interface::transfer_checked(cpi_ctx, actual_retribution, ctx.accounts.mint.decimals)?;

        penalized.deposit = penalized.deposit.saturating_sub(actual_retribution);
    }

    // Increment the correct infraction counter
    match severity {
        PenaltySeverity::Low => {
            penalized.low_infractions = penalized.low_infractions.saturating_add(1);
        }
        PenaltySeverity::Medium => {
            penalized.medium_infractions = penalized.medium_infractions.saturating_add(1);
        }
        PenaltySeverity::High => {
            penalized.high_infractions = penalized.high_infractions.saturating_add(1);
        }
    }

    let should_ban = penalized.low_infractions >= 10
        || penalized.medium_infractions >= 3
        || penalized.high_infractions >= 1;

    if should_ban {
        penalized.is_banned = true;
    }

    Ok(())
}
