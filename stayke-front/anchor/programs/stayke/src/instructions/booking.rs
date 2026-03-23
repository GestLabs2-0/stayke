use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{
    errors::StaykeErrors,
    events::booking::{BookingUpdateStatus, NewBookingEvent},
    state::{Booking, BookingDays, BookingStatus, PlatformConfig, Property, UserProfile},
    utils::{derive_date, DateComponents, TimestampExt},
};

#[derive(Accounts)]
#[instruction(check_in: i64)]
pub struct CreateBooking<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", client_profile.dni.as_ref()],
        bump = client_profile.bump,
        constraint = client.key() != property_host.key() @ StaykeErrors::HostCannotBookOwnProperty,
        constraint = client.key() == client_profile.owner @ StaykeErrors::UnauthorizedBooking,
        constraint = !client_profile.is_banned @ StaykeErrors::UserBanned,
        constraint = client_profile.is_verified @ StaykeErrors::UserNotVerified,
        constraint = client_profile.deposit >= config.minimum_deposit @ StaykeErrors::InsufficientDeposit,
    )]
    pub client_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"property", property_host.key().as_ref(), property.listing_id.to_le_bytes().as_ref()],
        bump = property.bump,
        constraint = property.host == property_host.key() @ StaykeErrors::InvalidHost
    )]
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
    pub property_host: Box<Account<'info, UserProfile>>,

    #[account(
        init,
        payer = client,
        space = 8 + Booking::INIT_SPACE,
        seeds = [b"booking", property.key().as_ref(), client.key().as_ref(), check_in.to_le_bytes().as_ref()],
        bump
    )]
    pub booking: Account<'info, Booking>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Box<Account<'info, PlatformConfig>>,

    pub system_program: Program<'info, System>,

    #[account(
        init_if_needed,
        payer = client,
        space = 8 + BookingDays::INIT_SPACE,
        seeds=[b"booking_days", property.key().as_ref(), check_in.year_month().to_le_bytes().as_ref()], 
        bump,
    )]
    pub booking_days: Account<'info, BookingDays>,
    // Check if there are remaining accounts for the next 12 months of booking days
}

pub fn ins_create_booking(
    ctx: Context<CreateBooking>,
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

    let remaining_accounts: &[AccountInfo<'_>] = ctx.remaining_accounts;
    let property = &ctx.accounts.property;
    let booking_days = &mut ctx.accounts.booking_days;

    reserve_days(
        remaining_accounts,
        property,
        booking_days,
        &start_date,
        &end_date,
    )?;

    let booking = &mut ctx.accounts.booking;
    let client_profile = &mut ctx.accounts.client_profile;
    let host_profile = &mut ctx.accounts.property_host;
    let bump = ctx.bumps.booking;

    let status = BookingStatus::Pending;

    let booking_inner = Booking {
        guest: client_profile.key(),
        host: host_profile.key(),
        property: property.key(),
        status: status.clone(),
        total_price: property.price_per_night * days,
        days,
        review: 0,
        check_in_date: start_date,
        check_out_date: end_date,
        deposit: 0,
        check_in,
        check_out,
        bump,
        escrow_bump: 0,
    };

    booking.set_inner(booking_inner);

    emit!(NewBookingEvent {
        guest: client_profile.key(),
        property: property.key(),
        booking: booking.key(),
        host: host_profile.key(),
        check_in,
        check_out,
        status
    });

    Ok(())
}

pub fn reserve_days<'a>(
    remaining_accounts: &'a [AccountInfo<'a>],
    property: &Account<'_, Property>,
    booking_days: &mut Account<'_, BookingDays>,
    check_in: &DateComponents,
    check_out: &DateComponents,
) -> Result<()> {
    if booking_days.initialized {
        require!(
            booking_days.property == property.key(),
            StaykeErrors::InvalidBookingDaysAccount
        );
    } else {
        booking_days.property = property.key();
        booking_days.month = check_in.month;
        booking_days.year = check_in.year;
        booking_days.occupied_days = 0;
        booking_days.initialized = true;
    }

    require!(
        booking_days.month == check_in.month,
        StaykeErrors::InvalidBookingDaysAccount
    );
    require!(
        booking_days.year == check_in.year,
        StaykeErrors::InvalidBookingDaysAccount
    );

    if booking_days.month == check_out.month && booking_days.year == check_out.year {
        let days_to_reserve = bitmap_days(check_in.day, check_out.day);

        require!(
            booking_days.occupied_days & days_to_reserve == 0,
            StaykeErrors::DatesAlreadyBooked
        );
        booking_days.occupied_days |= days_to_reserve;
    } else {
        let end_day = months_days(booking_days.month)?;
        let days_to_reserve = bitmap_days(check_in.day, end_day);
        require!(
            booking_days.occupied_days & days_to_reserve == 0,
            StaykeErrors::DatesAlreadyBooked
        );
        booking_days.occupied_days |= days_to_reserve;

        let remaining_booking_days = remaining_accounts
            .iter()
            .zip(check_in.month + 1..=check_out.month);

        for (account_info, month) in remaining_booking_days {
            let mut booking_days_account = Account::<BookingDays>::try_from(account_info)?;

            if !booking_days_account.initialized {
                booking_days_account.property = property.key();
                booking_days_account.month = month;
                booking_days_account.year = if month > check_in.month {
                    // There's a possible error if we take more than 2 years
                    check_in.year
                } else {
                    check_out.year
                };
                booking_days_account.occupied_days = 0;
                booking_days_account.initialized = true;
            }

            require!(
                booking_days_account.property == property.key(),
                StaykeErrors::InvalidBookingDaysAccount
            );
            require!(
                booking_days_account.month == month,
                StaykeErrors::InvalidBookingDaysAccount
            );

            let end_day = if month == check_out.month {
                check_out.day
            } else {
                months_days(month)?
            };
            let days_to_reserve = bitmap_days(1, end_day);
            require!(
                booking_days_account.occupied_days & days_to_reserve == 0,
                StaykeErrors::DatesAlreadyBooked
            );
            booking_days_account.occupied_days |= days_to_reserve;
            booking_days_account.exit(&crate::ID)?;
        }
    }

    Ok(())
}

pub fn months_days(month: u32) -> Result<u32> {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => Ok(31),
        4 | 6 | 9 | 11 => Ok(30),
        2 => Ok(28), // Not accounting for leap years for simplicity
        _ => err!(StaykeErrors::InvalidMonth),
    }
}

pub fn bitmap_days(start_day: u32, end_day: u32) -> u32 {
    let mut mask: u32 = 0;
    for day in start_day..=end_day {
        mask |= 1 << (day - 1) as usize;
    }

    mask
}

// To reserve days: number |= (1 << N);
// To release days: number &= ~(1 << N);

#[derive(Accounts)]
pub struct HostPendingAccept<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", property_host.dni.as_ref()],
        bump = property_host.bump,
        constraint = host.key() == property_host.owner @ StaykeErrors::UnauthorizedUser,
        constraint = !property_host.is_banned @ StaykeErrors::UserBanned,
        constraint = property_host.is_verified @ StaykeErrors::UserNotVerified,
        constraint = property_host.deposit >= config.minimum_deposit @ StaykeErrors::InsufficientDeposit,
        constraint = property_host.is_host @ StaykeErrors::UserNotHost
    )]
    pub property_host: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.host == property_host.key() @ StaykeErrors::InvalidBookingProperty,
        constraint = booking.status == BookingStatus::Pending @ StaykeErrors::InvalidBookingStatus
    )]
    pub booking: Account<'info, Booking>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, PlatformConfig>,
}

pub fn ins_host_pending_accept(ctx: Context<HostPendingAccept>) -> Result<()> {
    let booking = &mut ctx.accounts.booking;
    booking.status = BookingStatus::HostAccepted;
    emit!(BookingUpdateStatus {
        status: BookingStatus::HostAccepted,
        booking: booking.key()
    });

    Ok(())
}

#[derive(Accounts)]
pub struct HostPendingReject<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", property_host.dni.as_ref()],
        bump = property_host.bump,
        constraint = host.key() == property_host.owner @ StaykeErrors::UnauthorizedUser,
        constraint = !property_host.is_banned @ StaykeErrors::UserBanned,
        constraint = property_host.is_verified @ StaykeErrors::UserNotVerified,
        constraint = property_host.deposit >= config.minimum_deposit @ StaykeErrors::InsufficientDeposit,
        constraint = property_host.is_host @ StaykeErrors::UserNotHost
    )]
    pub property_host: Account<'info, UserProfile>,

    /// CHECK: This account is required to pass the lamports taken by the creation of booking for the rent
    /// We don't want to pass lamports to the host because it didn't create the booking
    /// The guest has the responsability to send the money from the PDA to its wallet until I find a way to avoit
    /// adding many accounts in this instruction
    #[account(mut, constraint = guest.key() == booking.guest @ StaykeErrors::WrongGuessPassed)]
    pub guest: UncheckedAccount<'info>,

    #[account(
        mut,
        close = guest,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.host == property_host.key() @ StaykeErrors::InvalidBookingProperty,
        constraint = booking.status == BookingStatus::Pending @ StaykeErrors::InvalidBookingStatus
    )]
    pub booking: Account<'info, Booking>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds=[b"booking_days", booking_days.property.as_ref(), booking_days.year_month().to_le_bytes().as_ref()],
        bump,
        constraint = booking_days.property == booking.property @ StaykeErrors::InvalidBookingDaysAccount
    )]
    pub booking_days: Account<'info, BookingDays>,
    // Check if there are remaining accounts for the next 12 months of booking days
}

pub fn ins_host_pending_reject(ctx: Context<HostPendingReject>) -> Result<()> {
    let booking = &mut ctx.accounts.booking;
    booking.status = BookingStatus::Cancelled;
    let remaining_accounts: &[AccountInfo<'_>] = ctx.remaining_accounts;
    let booking_days = &mut ctx.accounts.booking_days;

    release_days(
        remaining_accounts,
        booking,
        booking_days,
        &booking.check_in_date,
        &booking.check_out_date,
    )?;

    emit!(BookingUpdateStatus {
        status: BookingStatus::Cancelled,
        booking: booking.key()
    });
    Ok(())
}

pub fn release_days<'a>(
    remaining_accounts: &'a [AccountInfo<'a>],
    booking: &Account<'_, Booking>,
    booking_days: &mut Account<'_, BookingDays>,
    check_in: &DateComponents,
    check_out: &DateComponents,
) -> Result<()> {
    if !booking_days.initialized {
        return err!(StaykeErrors::UnitializedBookingDays);
    }

    require!(
        booking_days.month == check_in.month,
        StaykeErrors::InvalidBookingDaysAccount
    );
    require!(
        booking_days.year == check_in.year,
        StaykeErrors::InvalidBookingDaysAccount
    );

    if booking_days.month == check_out.month && booking_days.year == check_out.year {
        let days_to_release = bitmap_days(check_in.day, check_out.day);

        require!(
            booking_days.occupied_days & days_to_release == days_to_release,
            StaykeErrors::DatesUnbooked
        );
        booking_days.occupied_days &= !days_to_release;
    } else {
        let end_day = months_days(booking_days.month)?;
        let days_to_release = bitmap_days(check_in.day, end_day);
        require!(
            booking_days.occupied_days & days_to_release == days_to_release,
            StaykeErrors::DatesUnbooked
        );
        booking_days.occupied_days &= !days_to_release;

        let remaining_booking_days = remaining_accounts
            .iter()
            .zip(check_in.month + 1..=check_out.month);

        for (account_info, month) in remaining_booking_days {
            let mut booking_days_account = Account::<BookingDays>::try_from(account_info)?;

            if !booking_days_account.initialized {
                return err!(StaykeErrors::UnitializedBookingDays);
            }

            require!(
                booking_days_account.property == booking.property,
                StaykeErrors::InvalidBookingDaysAccount
            );
            require!(
                booking_days_account.month == month,
                StaykeErrors::InvalidBookingDaysAccount
            );

            let end_day = if month == check_out.month {
                check_out.day
            } else {
                months_days(month)?
            };
            let days_to_release = bitmap_days(1, end_day);
            require!(
                booking_days_account.occupied_days & days_to_release == days_to_release,
                StaykeErrors::DatesUnbooked
            );
            booking_days_account.occupied_days &= !days_to_release;
            booking_days_account.exit(&crate::ID)?;
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct ClientAcceptReserve<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", client_profile.dni.as_ref()],
        bump = client_profile.bump,
        constraint = client.key() == client_profile.owner @ StaykeErrors::UnauthorizedBooking,
        constraint = !client_profile.is_banned @ StaykeErrors::UserBanned,
        constraint = client_profile.is_verified @ StaykeErrors::UserNotVerified,
        constraint = client_profile.deposit >= config.minimum_deposit @ StaykeErrors::InsufficientDeposit,
    )]
    pub client_profile: Box<Account<'info, UserProfile>>,

    #[account(
        mut,
        seeds = [b"property", booking.host.as_ref(), property.listing_id.to_le_bytes().as_ref()],
        bump = property.bump,
        constraint = property.host == booking.host @ StaykeErrors::InvalidHost
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.status == BookingStatus::HostAccepted @ StaykeErrors::InvalidBookingStatus,
        constraint = booking.guest == client_profile.key() @ StaykeErrors::UnauthorizedBooking,
    )]
    pub booking: Box<Account<'info, Booking>>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Box<Account<'info, PlatformConfig>>,

    #[account(mut, constraint = mint.key() == config.usdc_mint @ StaykeErrors::InvalidTokenMint)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = client,
    )]
    pub client_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = client,
        token::mint = mint,
        token::authority = booking,
        seeds = [b"escrow", booking.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

pub fn ins_accept_reserve(ctx: Context<ClientAcceptReserve>) -> Result<()> {
    let booking = &mut ctx.accounts.booking;
    let time = clock::Clock::get()?.unix_timestamp;
    let one_day = 86400i64;
    if time < booking.check_in - one_day {
        return err!(StaykeErrors::TooEarlyToActivate);
    }
    let decimals = ctx.accounts.mint.decimals;

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.client_token_account.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.client.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(*cpi_program.key, cpi_accounts);
    token_interface::transfer_checked(cpi_context, booking.total_price, decimals)?;

    booking.status = BookingStatus::Active;
    booking.escrow_bump = ctx.bumps.escrow_token_account;
    ctx.accounts.property.booking_active = Some(booking.key());
    ctx.accounts.client_profile.active_booking = Some(booking.key());

    emit!(BookingUpdateStatus {
        status: BookingStatus::Active,
        booking: booking.key()
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ClientRejectReserve<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", client_profile.dni.as_ref()],
        bump = client_profile.bump,
        constraint = client.key() != booking.host @ StaykeErrors::HostCannotBookOwnProperty,
        constraint = client.key() == client_profile.owner @ StaykeErrors::UnauthorizedBooking,
        constraint = !client_profile.is_banned @ StaykeErrors::UserBanned,
        constraint = client_profile.is_verified @ StaykeErrors::UserNotVerified,
    )]
    pub client_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        close = client,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.status == BookingStatus::HostAccepted || booking.status == BookingStatus::Pending @ StaykeErrors::InvalidBookingStatus,
        constraint = booking.guest == client_profile.key() @ StaykeErrors::UnauthorizedBooking,
    )]
    pub booking: Account<'info, Booking>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds=[b"booking_days", booking.property.as_ref(), booking_days.year_month().to_le_bytes().as_ref()], 
        bump,
    )]
    pub booking_days: Account<'info, BookingDays>,
}

pub fn ins_client_reject_reserve(ctx: Context<ClientRejectReserve>) -> Result<()> {
    let booking = &mut ctx.accounts.booking;
    booking.status = BookingStatus::Cancelled;
    let remaining_accounts: &[AccountInfo<'_>] = ctx.remaining_accounts;
    let booking_days = &mut ctx.accounts.booking_days;

    release_days(
        remaining_accounts,
        booking,
        booking_days,
        &booking.check_in_date,
        &booking.check_out_date,
    )?;

    emit!(BookingUpdateStatus {
        status: BookingStatus::Cancelled,
        booking: booking.key()
    });
    Ok(())
}

// ---------------------------------------------------------------------------
// Complete stay
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct CompleteStay<'info> {
    /// The guest — must be the one who made the booking.
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", client_profile.dni.as_ref()],
        bump = client_profile.bump,
        constraint = client.key() == client_profile.owner @ StaykeErrors::UnauthorizedUser,
        constraint = !client_profile.is_banned @ StaykeErrors::UserBanned,
    )]
    pub client_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"user", host_profile.dni.as_ref()],
        bump = host_profile.bump,
    )]
    pub host_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"property", booking.host.as_ref(), property.listing_id.to_le_bytes().as_ref()],
        bump = property.bump,
        constraint = property.host == booking.host @ StaykeErrors::InvalidHost,
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.guest == client_profile.key() @ StaykeErrors::UnauthorizedUser,
        constraint = booking.status == BookingStatus::Active @ StaykeErrors::BookingNotActive,
    )]
    pub booking: Box<Account<'info, Booking>>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Box<Account<'info, PlatformConfig>>,

    /// Escrow token account holding the booking payment.
    #[account(
        mut,
        seeds = [b"escrow", booking.key().as_ref()],
        bump = booking.escrow_bump,
        token::mint = mint,
        token::authority = booking,
    )]
    pub escrow_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Host's USDC token account — receives (total_price - fee).
    #[account(mut, constraint = host_token_account.key() == host_profile.token_account @ StaykeErrors::InvalidTokenAccount)]
    pub host_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Platform vault token account — receives the fee.
    #[account(
        mut,
        constraint = platform_vault_token_account.key() == config.platform_vault @ StaykeErrors::InvalidTreasuryAccount,
    )]
    pub platform_vault_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, constraint = mint.key() == config.usdc_mint @ StaykeErrors::InvalidTokenMint)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn ins_complete_stay(ctx: Context<CompleteStay>) -> Result<()> {
    let booking = &mut ctx.accounts.booking;
    let config = &ctx.accounts.config;
    let decimals = ctx.accounts.mint.decimals;

    let fee = (booking.total_price as u128)
        .saturating_mul(config.fee_bps as u128)
        .saturating_div(10_000) as u64;
    let host_amount = booking.total_price.saturating_sub(fee);

    // Seeds to sign as the booking PDA (authority of the escrow)
    let booking_seeds: &[&[&[u8]]] = &[&[
        b"booking",
        booking.property.as_ref(),
        booking.guest.as_ref(),
        &booking.check_in.to_le_bytes(),
        &[booking.bump],
    ]];

    if host_amount > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.host_token_account.to_account_info(),
            authority: booking.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().key.clone(),
            cpi_accounts,
            booking_seeds,
        );
        token_interface::transfer_checked(cpi_ctx, host_amount, decimals)?;
    }

    if fee > 0 {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.platform_vault_token_account.to_account_info(),
            authority: booking.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().key.clone(),
            cpi_accounts,
            booking_seeds,
        );
        token_interface::transfer_checked(cpi_ctx, fee, decimals)?;
    }

    let cpi_close = token_interface::CloseAccount {
        account: ctx.accounts.escrow_token_account.to_account_info(),
        destination: ctx.accounts.client.to_account_info(),
        authority: booking.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info().key.clone(),
        cpi_close,
        booking_seeds,
    );
    token_interface::close_account(cpi_ctx)?;

    Ok(())
}

#[derive(Accounts)]
pub struct CloseBooking<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", client_profile.dni.as_ref()],
        bump = client_profile.bump,
        constraint = client.key() == client_profile.owner @ StaykeErrors::UnauthorizedUser,
        constraint = !client_profile.is_banned @ StaykeErrors::UserBanned,
    )]
    pub client_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"user", host_profile.dni.as_ref()],
        bump = host_profile.bump,
    )]
    pub host_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"property", booking.host.as_ref(), property.listing_id.to_le_bytes().as_ref()],
        bump = property.bump,
        constraint = property.host == booking.host @ StaykeErrors::InvalidHost,
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        close = client,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.guest == client_profile.key() @ StaykeErrors::UnauthorizedUser,
        constraint = booking.status == BookingStatus::Active @ StaykeErrors::BookingNotActive,
    )]
    pub booking: Account<'info, Booking>,
}

pub fn ins_close_booking(ctx: Context<CloseBooking>, score: u8) -> Result<()> {
    require!(score >= 1 && score <= 5, StaykeErrors::InvalidScore);

    let booking = &ctx.accounts.booking;
    let booking_key = booking.key();

    ctx.accounts.client_profile.completed_stays += 1;
    ctx.accounts.client_profile.active_booking = None;

    ctx.accounts.host_profile.hosted_stays += 1;
    ctx.accounts.host_profile.total_score_host += score as u64;
    ctx.accounts.host_profile.host_reviews += 1;

    ctx.accounts.property.booking_active = None;

    emit!(BookingUpdateStatus {
        status: BookingStatus::Completed,
        booking: booking_key,
    });

    Ok(())
}
