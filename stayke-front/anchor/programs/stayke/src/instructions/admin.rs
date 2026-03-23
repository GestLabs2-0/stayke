use anchor_lang::prelude::*;

use crate::{
    errors::StaykeErrors,
    state::{PlatformConfig, MAX_ADMINS},
};

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
