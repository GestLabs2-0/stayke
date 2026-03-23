use anchor_lang::prelude::*;

use crate::{
    errors::StaykeErrors,
    state::{Property, UserProfile},
};

#[derive(Accounts)]
pub struct InitProperty<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user_profile.dni.as_ref(), signer.key().as_ref()],
        constraint = signer.key() == user_profile.owner @ StaykeErrors::UnauthorizedHost,
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(
        init,
        seeds = [b"property", user_profile.key().as_ref(), user_profile.listing_count.to_le_bytes().as_ref()],
        bump,
        payer = signer,
        space = 8 + Property::INIT_SPACE)]
    pub property: Account<'info, Property>,

    pub system_program: Program<'info, System>,
}

pub fn ins_register_property(ctx: Context<InitProperty>, price_per_night: u64) -> Result<()> {
    let property_acc = &mut ctx.accounts.property;
    let user_profile = &mut ctx.accounts.user_profile;
    let bump = ctx.bumps.property;

    require!(
        ctx.accounts.signer.key() == user_profile.owner,
        StaykeErrors::UnauthorizedHost
    );

    let property = Property {
        listing_id: user_profile.listing_count,
        price_per_night,
        booking_active: None,
        hash_state: String::new(),
        host: user_profile.key(),
        bump,
    };

    property_acc.set_inner(property);

    user_profile.listing_count += 1;

    Ok(())
}

#[derive(Accounts)]
pub struct ModifyProperty<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user_profile.dni.as_ref(), signer.key().as_ref()],
        constraint = signer.key() == user_profile.owner @ StaykeErrors::UnauthorizedHost,
        constraint = user_profile.listing_count > 0 @ StaykeErrors::NoPropertiesToModify,
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut,
        seeds = [b"property", user_profile.key().as_ref(), property.listing_id.to_le_bytes().as_ref()],
        constraint = property.booking_active.is_none() @ StaykeErrors::PropertyInActiveBooking,
        constraint = property.host == user_profile.key() @ StaykeErrors::UnauthorizedHost,
        bump = property.bump
    )]
    pub property: Account<'info, Property>,
}

pub fn ins_update_property_price(
    ctx: Context<ModifyProperty>,
    new_price_per_night: u64,
) -> Result<()> {
    let property = &mut ctx.accounts.property;

    property.price_per_night = new_price_per_night;

    Ok(())
}

// TODO: implement function to update property hash state after each booking, to ensure the integrity of the off-chain data storage
