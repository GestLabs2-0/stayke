use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::errors::StaykeErrors;
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

pub fn deposit(
    ctx: Context<Deposit>,
    _dni_hash: [u8; 32],
    amount: u64,
    decimals: u8,
) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let config = &ctx.accounts.config;
    let treasury = &ctx.accounts.treasury;
    let token_account = &ctx.accounts.token_account;
    let mint_acc = &ctx.accounts.mint;

    require!(
        amount >= ctx.accounts.config.minimum_deposit,
        StaykeErrors::DepositTooLow
    );

    require!(
        config.usdc_mint == mint_acc.key(),
        StaykeErrors::InvalidTokenMint
    );

    require!(
        treasury.key() == config.treasury,
        StaykeErrors::InvalidTreasuryAccount
    );

    let cpi_accounts = TransferChecked {
        from: token_account.to_account_info(),
        to: treasury.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
        mint: mint_acc.to_account_info(),
    };
    let cpi_program = token_account.to_account_info();

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

pub fn set_host_status(
    ctx: Context<SetHostStatus>,
    dni_hash: [u8; 32],
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
