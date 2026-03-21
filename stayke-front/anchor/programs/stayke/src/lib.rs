use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::state::UserProfile;

mod state;

#[cfg(test)]
mod tests;

declare_id!("BSX3yt7xpwNp8BtkJhDMv2Q1227pji3TpvSJWnnLENHg");

#[program]
pub mod stayke {
    use super::*;
}

#[derive(Accounts)]
pub struct StaykeActions<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", signer.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum VaultError {
    #[msg("Vault already exists")]
    VaultAlreadyExists,
    #[msg("Invalid amount")]
    InvalidAmount,
}
