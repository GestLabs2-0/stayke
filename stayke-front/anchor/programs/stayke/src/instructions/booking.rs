use anchor_lang::prelude::*;

use crate::{
    errors::StaykeErrors,
    state::{Booking, BookingDays, BookingStatus, PlatformConfig, Property, UserProfile},
    utils::{DateComponents, derive_date, TimestampExt},
};

#[derive(Accounts)]
#[instruction(check_in: i64)]
pub struct CreateBooking<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(mut)]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"user", property_host.dni.as_ref()],
        bump = property_host.bump,
        constraint = !property_host.is_banned @ StaykeErrors::UserBanned,
        constraint = property_host.is_verified @ StaykeErrors::UserNotVerified,
        constraint = property_host.deposit >= config.minimum_deposit @ StaykeErrors::InsufficientDeposit,
        constraint = property_host.is_host @ StaykeErrors::UserNotHost
    )]
    pub property_host: Account<'info, UserProfile>,

    #[account(
        init,
        payer = client,
        space = 8 + Booking::INIT_SPACE,
        seeds = [b"booking", property.key().as_ref(), client.key().as_ref(), check_in.to_ne_bytes().as_ref()],
        bump,
    )]
    pub booking: Account<'info, Booking>,

    pub config: Account<'info, PlatformConfig>,
    pub system_program: Program<'info, System>,

    #[account(
        init_if_needed, 
        payer = client,
        space = 8 + BookingDays::INIT_SPACE,
        seeds=[b"booking_days", property.key().as_ref(), check_in.year_month().to_ne_bytes().as_ref()], 
        bump, 
    )]
    pub booking_days: Account<'info, BookingDays>,
    // Check if there are remaining accounts for the next 12 months of booking days
}

pub fn ins_create_booking(
    mut ctx:  Context<CreateBooking>,
    check_in: i64,
    check_out: i64,
) -> Result<()> {
    require!(check_in < check_out, StaykeErrors::InvalidBookingDates);
    require!(
        check_in > Clock::get()?.unix_timestamp,
        StaykeErrors::InvalidBookingDates
    );

    let start_date = derive_date(check_in);
    let end_date = derive_date(check_out);

    let days = ((check_out - check_in) / 86400) as u64;

    reserve_days(&mut ctx, &start_date, &end_date)?;

    let booking = &mut ctx.accounts.booking;
    let client = &mut ctx.accounts.client;
    let property = &mut ctx.accounts.property;
    let host_profile = &mut ctx.accounts.property_host;
    let bump = ctx.bumps.booking;


    let booking_inner = Booking {
        guest: client.key(),
        host: host_profile.key(),
        property: property.key(),
        status: BookingStatus::Pending,
        total_price: property.price_per_night * days,
        days,
        yearmonth_in: start_date.year_month,
        yearmonth_out: end_date.year_month,
        deposit: 0,
        review: 0,
        check_in,
        check_out,
        bump,
    };

    booking.set_inner(booking_inner);

    Ok(())
}

pub fn reserve_days(
    ctx: &mut Context<CreateBooking>,
    check_in: &DateComponents,
    check_out: &DateComponents,
) -> Result<()> {
    let booking_days = &mut ctx.accounts.booking_days;

    if booking_days.initialized {
        require!(booking_days.property == ctx.accounts.property.key(), StaykeErrors::InvalidBookingDaysAccount);
    } else {
        booking_days.property = ctx.accounts.property.key();
        booking_days.month = check_in.month;
        booking_days.year = check_in.year;
        booking_days.occupied_days = 0;
        booking_days.initialized = true;
    }

    require!(booking_days.month == check_in.month, StaykeErrors::InvalidBookingDaysAccount);
    require!(booking_days.year == check_in.year, StaykeErrors::InvalidBookingDaysAccount);
    
    if booking_days.month == check_out.month {
        require!(booking_days.year == check_out.year, StaykeErrors::InvalidBookingDaysAccount);
        let days_to_reserve = bitmap_days(check_in.day, check_out.day, BitmapOperation::Reserve);

        require!(booking_days.occupied_days & days_to_reserve == 0, StaykeErrors::DatesAlreadyBooked);
        booking_days.occupied_days |= days_to_reserve;
    } else {
          let end_day = months_days(booking_days.month);
        let days_to_reserve = bitmap_days(check_in.day, end_day, BitmapOperation::Reserve);
        require!(booking_days.occupied_days & days_to_reserve == 0, StaykeErrors::DatesAlreadyBooked);
        booking_days.occupied_days |= days_to_reserve;

        let remaining_booking_days= ctx.remaining_accounts
        .iter()
        .zip(check_in.month + 1..=check_out.month);

        for ( account_info, month) in remaining_booking_days {
            let mut booking_days_account = Account::<BookingDays>::try_from(account_info)?;
            require!(
                booking_days_account.property == ctx.accounts.property.key(),
                StaykeErrors::InvalidBookingDaysAccount
            );
            require!(
                booking_days_account.month == month,
                StaykeErrors::InvalidBookingDaysAccount
            );

            let end_day =  if month == check_out.month {
                check_out.day
            } else {
               months_days(month)
            };
            let days_to_reserve = bitmap_days(1, end_day, BitmapOperation::Reserve);
            require!(booking_days_account.occupied_days & days_to_reserve == 0, StaykeErrors::DatesAlreadyBooked);
            booking_days_account.occupied_days |= days_to_reserve;
        }
    }


    Ok(())
}

pub fn months_days(month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => 28, // Not accounting for leap years for simplicity
        _ => panic!("Invalid month"),
    }
}

pub fn bitmap_days(start_day: u32, end_day: u32, operation: BitmapOperation) -> u32 {
    let mut days: u32 = 0;

    match operation {
        BitmapOperation::Reserve => {
            for day in start_day..=end_day {
                days |= 1 << (day - 1) as usize;
            }
        }
        BitmapOperation::Release => {
            for day in start_day..=end_day {
                days &= !(1 << (day - 1) as usize);
            }
        }
    }

    days
}

pub enum BitmapOperation {
    Reserve,
    Release,
}

// To reserve days: number |= (1 << N);
// To release days: number &= ~(1 << N);
