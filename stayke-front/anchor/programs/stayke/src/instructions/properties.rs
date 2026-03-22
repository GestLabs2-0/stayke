use anchor_lang::prelude::*;

use crate::{errors::StaykeErrors, state::{Property, UserProfile}};

#[derive(Accounts)]
#[instruction(dni_hash: [u8; 32], listing_count: u8)]
pub struct InitProperty<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", dni_hash.as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(init, 
        seeds = [b"property", user_profile.key().as_ref(), listing_count.to_ne_bytes().as_ref()], 
        bump, 
        payer = signer, 
        space = 8 + Property::INIT_SPACE)]
    pub property: Account<'info, Property>,

    pub system_program: Program<'info, System>,
}

pub fn register_property(ctx: Context<InitProperty>, dni_hash: [u8; 32], listing_count: u8, price_per_night: u64) -> Result<()> {
    let property_acc = &mut ctx.accounts.property;
    let user_profile = &mut ctx.accounts.user_profile;
    let bump = ctx.bumps.property;

    require!(
        ctx.accounts.signer.key() == user_profile.owner,
        StaykeErrors::UnauthorizedHost
    );

    let property = Property {
        listing_id: listing_count,
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
#[instruction(dni_hash: [u8;32], listing_count: u8)]
pub struct ModifyProperty<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", dni_hash.as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut, 
        seeds = [b"property", user_profile.key().as_ref(), listing_count.to_ne_bytes().as_ref()], 
        bump)]
    pub property: Account<'info, Property>,
}

pub fn update_property_price(ctx: Context<ModifyProperty>, _dni_hash: [u8; 32], listing_count: u8, new_price_per_night: u64) -> Result<()> {
    let property = &mut ctx.accounts.property;
    let user_profile = &ctx.accounts.user_profile;

    require!(
        ctx.accounts.signer.key == &user_profile.owner,
        StaykeErrors::UnauthorizedHost
    );

    require!(
        property.host == user_profile.key(),
        StaykeErrors::PropertyInActiveBooking
    );

    require!(
        property.booking_active.is_none(),
        StaykeErrors::PropertyInActiveBooking
    );

    property.price_per_night = new_price_per_night;

    Ok(())
}

// TODO: implement function to update property hash state after each booking, to ensure the integrity of the off-chain data storage