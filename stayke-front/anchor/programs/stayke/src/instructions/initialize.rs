use anchor_lang::prelude::*;

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
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace)]
pub struct InitialConfig {
    #[max_len(9)]
    pub admins: Vec<Pubkey>,

    pub treasury: Pubkey,
    pub escrow_treasury: Pubkey,

    pub retribution_bps_low: u16,
    pub retribution_bps_medium: u16,
    pub retribution_bps_high: u16,

    pub minimum_deposit: u64,
    pub usdc_mint: Pubkey,
}

pub fn initialize_contract(
    ctx: Context<InitializeContract>,
    initial_data: InitialConfig,
) -> Result<()> {
    let acc_config = &mut ctx.accounts.config;

    let InitialConfig {
        admins,
        escrow_treasury,
        minimum_deposit,
        retribution_bps_high,
        retribution_bps_medium,
        retribution_bps_low,
        treasury,
        usdc_mint,
    } = initial_data;

    let mut config = PlatformConfig {
        admins: vec![ctx.accounts.signer.key()],
        bump: ctx.bumps.config,
        escrow_treasury,
        minimum_deposit,
        retribution_bps_high,
        retribution_bps_medium,
        retribution_bps_low,
        treasury,
        usdc_mint,
    };

    let mut all_admins = vec![ctx.accounts.signer.key()];
    config.admins.extend(admins);

    acc_config.set_inner(config);

    Ok(())
}

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

pub fn register_user(ctx: Context<RegisterUser>, dni_hash: [u8; 32]) -> Result<()> {
    let user_acc = &mut ctx.accounts.user_profile;
    let bump = ctx.bumps.user_profile;

    let user = UserProfile {
        owner: ctx.accounts.signer.key(),
        is_verified: false,
        deposit: 0,
        deposit_timestamp: 0,
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

        bump,
    };

    user_acc.set_inner(user);

    Ok(())
}
