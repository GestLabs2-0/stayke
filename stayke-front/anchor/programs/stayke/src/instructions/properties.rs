use anchor_lang::prelude::*;

use crate::state::{Property, UserProfile};

#[derive(Accounts)]
#[instructions(dni_hash: [u8; 32], listing_count: u64)]
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
        seeds = [b"property", user_profile.as_ref(), listing_count], 
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

    let property = Property {
        listing_id: listing_count,
        price_per_night,
        booking_active: None,
        hash_state: String::new(),
        host: ctx.accounts.signer.key(),
        bump,
    };

    property_acc.set_inner(property);

    user_profile.listing_count += 1;

    Ok(())
}