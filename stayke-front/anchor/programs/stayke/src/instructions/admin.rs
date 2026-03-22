use anchor_lang::prelude::*;

use crate::{errors::StaykeErrors, state::PlatformConfig};

#[derive(Accounts)]
pub struct AddRemoveAdmin<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, PlatformConfig>,
}

pub fn add_admin(ctx: Context<AddRemoveAdmin>, new_admin: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require!(
        config.admins.contains(&ctx.accounts.signer.key()),
        StaykeErrors::UnauthorizedAdmin
    );

    if !config.admins.contains(&new_admin) {
        config.admins.push(new_admin);
    }

    Ok(())
}

pub fn remove_admin(ctx: Context<AddRemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;

    require!(
        config.admins.contains(&ctx.accounts.signer.key()),
        StaykeErrors::UnauthorizedAdmin
    );

    if let Some(pos) = config.admins.iter().position(|x| *x == admin_to_remove) {
        config.admins.remove(pos);
    }

    Ok(())
}
