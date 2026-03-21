use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::errors::DepositErrors;
use crate::state::{PlatformConfig, UserProfile};

#[derive(Accounts)]
#[instruction(dni_hash: [u8; 32])]
pub struct Deposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", dni_hash.as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, PlatformConfig>,

    pub token_account: InterfaceAccount<'info, TokenAccount>,

    pub treasury: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn deposit(ctx: Context<Deposit>, amount: u64, decimals: u64) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let config = &ctx.accounts.config;

    require!(
        amount >= ctx.accounts.config.minimum_deposit,
        DepositErrors::DepositTooLow
    );

    require!(
        config.usdc_mint == ctx.accounts.mint.key(),
        DepositErrors::InvalidTokenMint
    );

    require!(
        ctx.accounts.treasury == config.treasury,
        DepositErrors::InvalidTreasuryAccount
    );

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.token_account.to_account_info(),
        to: ctx.accounts.config.escrow_treasury.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(*cpi_program.key, cpi_accounts);
    token_interface::transfer_checked(cpi_context, amount, decimals)?;
    // Update the user's balance
    user_profile.balance += amount;
    user_profile.deposit_timestamp = Clock::get()?.unix_timestamp;

    Ok(())
}
