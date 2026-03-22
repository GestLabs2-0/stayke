use anchor_lang::prelude::*;

use crate::{errors::{StaykeErrors}, state::{Booking, Property, UserProfile}, utils::derive_date};

#[derive(Accounts)]
#[instruction(dni_hash: [u8; 32], check_in: i64)]
pub struct CreateBooking<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", dni_hash.as_ref()],
        bump,
    )]
    pub client: Account<'info, UserProfile>,

    pub property_host: Account<'info, UserProfile>,

    pub property: Account<'info, Property>,

    #[account(init, 
        seeds = [b"booking", client.key().as_ref(), property.key().as_ref(), check_in.to_ne_bytes().as_ref()], 
        bump, 
        payer = signer, 
        space = 8 + Booking::INIT_SPACE)]
    pub booking: Account<'info, Booking>,

    pub system_program: Program<'info, System>,
}

pub fn create_booking(ctx: Context<CreateBooking>, dni_hash: [u8; 32], check_in: i64, check_out: i64) -> Result<()> {
    let booking_acc = &mut ctx.accounts.booking;
    let client_profile = &mut ctx.accounts.client;
    let property = &mut ctx.accounts.property;
    let host_profile = &mut ctx.accounts.property_host;
    let bump = ctx.bumps.booking;

    let start_date = derive_date(check_in);
    let end_date = derive_date(check_out);

    require!(
        ctx.accounts.signer.key() == client_profile.owner,
        StaykeErrors::UnauthorizedUser
    );

    require!(
        check_in < check_out,
        StaykeErrors::InvalidBookingDates
    );
    // let booking = Booking {
    //     client: client_profile.key(),
    //     host: host_profile.key(),
    //     property: property.key(),
    //     check_in,
    //     check_out,
    //     is_active: true,
    //     bump,
    // };

    // booking_acc.set_inner(booking);

    property.booking_active = Some(booking_acc.key());

    Ok(())
}