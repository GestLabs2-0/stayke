use anchor_lang::prelude::*;

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
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;

    // Update the user's balance
    user_profile.balance += amount;

    Ok(())
}
