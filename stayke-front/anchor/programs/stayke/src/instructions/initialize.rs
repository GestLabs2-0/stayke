use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::StaykeErrors;
use crate::state::{PlatformConfig, UserProfile};

#[derive(Accounts)]
pub struct InitializeContract<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, PlatformConfig>,

    // ---- Treasury ----
    // PDA that acts as the authority of the treasury token account.
    // seeds = [b"treasury"] — no actual account data, just a signer PDA.
    /// CHECK: This is a PDA used as the authority for the treasury token account. No data is stored here.
    #[account(
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury_pda: UncheckedAccount<'info>,

    /// Token account controlled by treasury_pda. Holds user guarantee deposits.
    #[account(
        init,
        payer = signer,
        token::mint = usdc_mint,
        token::authority = treasury_pda,
        seeds = [b"treasury_vault"],
        bump,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    // ---- Platform Vault ----
    // PDA that acts as the authority of the platform earnings token account.
    /// CHECK: This is a PDA used as the authority for the platform vault token account. No data is stored here.
    #[account(
        seeds = [b"platform_vault"],
        bump,
    )]
    pub platform_vault_pda: UncheckedAccount<'info>,

    /// Token account controlled by platform_vault_pda. Holds platform fees.
    #[account(
        init,
        payer = signer,
        token::mint = usdc_mint,
        token::authority = platform_vault_pda,
        seeds = [b"platform_vault_token"],
        bump,
    )]
    pub platform_vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace)]
pub struct InitialConfig {
    #[max_len(9)]
    pub admins: Vec<Pubkey>,

    pub retribution_bps_low: u16,
    pub retribution_bps_medium: u16,
    pub retribution_bps_high: u16,

    pub minimum_deposit: u64,

    /// Platform fee charged per completed booking, in basis points (e.g. 500 = 5%).
    pub fee_bps: u16,
}

pub fn ins_initialize_contract(
    ctx: Context<InitializeContract>,
    initial_data: InitialConfig,
) -> Result<()> {
    let acc_config = &mut ctx.accounts.config;

    require!(
        !acc_config.is_initialized,
        StaykeErrors::ConfigAlreadyInitialized
    );

    let InitialConfig {
        admins,
        minimum_deposit,
        retribution_bps_high,
        retribution_bps_medium,
        retribution_bps_low,
        fee_bps,
    } = initial_data;

    require!(retribution_bps_high < 10000, StaykeErrors::InvalidRetributionBps);
    require!(retribution_bps_medium < 10000, StaykeErrors::InvalidRetributionBps);
    require!(retribution_bps_low < 10000, StaykeErrors::InvalidRetributionBps);
    require!(fee_bps < 10000, StaykeErrors::InvalidFeeBps);

    let mut config = PlatformConfig {
        admins: vec![ctx.accounts.signer.key()],
        bump: ctx.bumps.config,

        treasury: ctx.accounts.treasury_token_account.key(),
        treasury_bump: ctx.bumps.treasury_pda,

        platform_vault: ctx.accounts.platform_vault_token_account.key(),
        platform_vault_bump: ctx.bumps.platform_vault_pda,

        usdc_mint: ctx.accounts.usdc_mint.key(),
        fee_bps,

        minimum_deposit,
        retribution_bps_high,
        retribution_bps_medium,
        retribution_bps_low,

        is_initialized: true,
    };

    config.admins.extend(admins);

    acc_config.set_inner(config);

    Ok(())
}

// ---------------------------------------------------------------------------
// Register user
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(dni_hash: [u8; 32])]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user", dni_hash.as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

pub fn ins_register_user(ctx: Context<RegisterUser>, dni_hash: [u8; 32]) -> Result<()> {
    let user_acc = &mut ctx.accounts.user_profile;
    let bump = ctx.bumps.user_profile;

    let user = UserProfile {
        owner: ctx.accounts.signer.key(),
        is_verified: false,
        deposit: 0,
        deposit_timestamp: 0,
        token_account: Pubkey::default(),
        dni: dni_hash,

        active_booking: None,

        host_reviews: 0,
        total_score_host: 0,

        client_reviews: 0,
        total_score_client: 0,

        completed_stays: 0,
        hosted_stays: 0,
        is_banned: false,
        is_host: false,

        low_infractions: 0,
        medium_infractions: 0,
        high_infractions: 0,

        listing_count: 0,

        bump,
    };

    user_acc.set_inner(user);

    Ok(())
}
