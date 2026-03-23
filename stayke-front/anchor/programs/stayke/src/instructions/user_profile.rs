use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::errors::StaykeErrors;
use crate::state::{PlatformConfig, UserProfile};

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
    // Update the user's balance
    user_profile.deposit += amount;
    user_profile.deposit_timestamp = Clock::get()?.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
#[instruction(dni_hash: [u8; 32])]
pub struct SetHostStatus<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", dni_hash.as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,
}

pub fn ins_set_host_status(
    ctx: Context<SetHostStatus>,
    _dni_hash: [u8; 32],
    status: bool,
) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;

    require!(
        ctx.accounts.signer.key() == user_profile.owner,
        StaykeErrors::UnauthorizedUser
    );

    user_profile.is_host = status;

    Ok(())
}
