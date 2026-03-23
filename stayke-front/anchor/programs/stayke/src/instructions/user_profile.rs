use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::errors::StaykeErrors;
use crate::state::{PlatformConfig, UserProfile};

// ---------------------------------------------------------------------------
// Deposit guarantee
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user_profile.dni.as_ref()],
        constraint = signer.key() == user_profile.owner @ StaykeErrors::UnauthorizedUser,
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, PlatformConfig>,

    pub sender_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut, constraint = treasury.key() == config.treasury @ StaykeErrors::InvalidTreasuryAccount)]
    pub treasury: InterfaceAccount<'info, TokenAccount>,

    #[account(mut, constraint = mint.key() == config.usdc_mint @ StaykeErrors::InvalidTokenMint)]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn ins_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let config = &ctx.accounts.config;
    let decimals = ctx.accounts.mint.decimals;

    require!(
        amount >= config.minimum_deposit,
        StaykeErrors::DepositTooLow
    );

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.sender_token_account.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(*cpi_program.key, cpi_accounts);
    token_interface::transfer_checked(cpi_context, amount, decimals)?;

    user_profile.deposit += amount;
    user_profile.deposit_timestamp = Clock::get()?.unix_timestamp;
    user_profile.token_account = ctx.accounts.sender_token_account.key();

    Ok(())
}

// ---------------------------------------------------------------------------
// Set host status
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct SetHostStatus<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user_profile.dni.as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,
}

pub fn ins_set_host_status(ctx: Context<SetHostStatus>, status: bool) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;

    require!(
        ctx.accounts.signer.key() == user_profile.owner,
        StaykeErrors::UnauthorizedUser
    );

    user_profile.is_host = status;

    Ok(())
}

// ---------------------------------------------------------------------------
// Withdraw guarantee
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct WithdrawGuarantee<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user_profile.dni.as_ref()],
        constraint = signer.key() == user_profile.owner @ StaykeErrors::UnauthorizedUser,
        constraint = !user_profile.is_banned @ StaykeErrors::UserBanned,
        constraint = user_profile.active_booking.is_none() @ StaykeErrors::WithdrawWithActiveBooking,
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, PlatformConfig>,

    /// Treasury token account — source of the withdrawal.
    #[account(
        mut,
        constraint = treasury_token_account.key() == config.treasury @ StaykeErrors::InvalidTreasuryAccount,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Treasury PDA — signs the CPI transfer out of the treasury.
    #[account(seeds = [b"treasury"], bump = config.treasury_bump)]
    pub treasury_pda: UncheckedAccount<'info>,

    /// Destination: the user's own USDC token account.
    #[account(mut)]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut, constraint = mint.key() == config.usdc_mint @ StaykeErrors::InvalidTokenMint)]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn ins_withdraw_guarantee(ctx: Context<WithdrawGuarantee>, amount: u64) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let config = &ctx.accounts.config;

    require!(
        amount > 0 && amount <= user_profile.deposit,
        StaykeErrors::InsufficientDepositBalance
    );

    let treasury_seeds: &[&[&[u8]]] = &[&[b"treasury", &[config.treasury_bump]]];
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.treasury_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.treasury_pda.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        treasury_seeds,
    );
    token_interface::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    user_profile.deposit = user_profile.deposit.saturating_sub(amount);

    Ok(())
}
