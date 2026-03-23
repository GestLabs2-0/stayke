use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{
    errors::StaykeErrors,
    events::booking::BookingUpdateStatus,
    state::{
        Booking, BookingStatus, Dispute, DisputeReason, DisputeStatus, PlatformConfig, Property,
        UserProfile,
    },
};

// ---------------------------------------------------------------------------
// Open dispute
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"booking", booking.property.as_ref(), booking.guest.as_ref(), booking.check_in.to_le_bytes().as_ref()],
        bump = booking.bump,
        constraint = booking.status == BookingStatus::Active @ StaykeErrors::BookingNotActive,
        // Only the guest or the host can open a dispute
        constraint = caller.key() == booking.guest || caller.key() == booking.host @ StaykeErrors::NotAPartyToBooking,
    )]
    pub booking: Account<'info, Booking>,

    #[account(
        init,
        payer = caller,
        space = 8 + Dispute::INIT_SPACE,
        seeds = [b"dispute", booking.key().as_ref()],
        bump,
    )]
    pub dispute: Account<'info, Dispute>,

    pub system_program: Program<'info, System>,
}

pub fn ins_open_dispute(ctx: Context<OpenDispute>, reason: DisputeReason) -> Result<()> {
    let booking = &mut ctx.accounts.booking;
    let dispute = &mut ctx.accounts.dispute;

    booking.status = BookingStatus::Disputed;

    dispute.booking = booking.key();
    dispute.opened_by = ctx.accounts.caller.key();
    dispute.reason = reason;
    dispute.status = DisputeStatus::Open;
    dispute.bump = ctx.bumps.dispute;

    emit!(BookingUpdateStatus {
        status: BookingStatus::Disputed,
        booking: booking.key()
    });

    Ok(())
}

// ----------------------------------------------------
//       Resuelve la disputa
// ----------------------------------------------------

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admins.contains(&admin.key()) @ StaykeErrors::UnauthorizedAdmin,
    )]
    pub config: Box<Account<'info, PlatformConfig>>,

    #[account(
        mut,
        seeds = [
            b"booking",
            booking.property.as_ref(),
            booking.guest.as_ref(),
            booking.check_in.to_le_bytes().as_ref(),
        ],
        bump = booking.bump,
        constraint = booking.status == BookingStatus::Disputed @ StaykeErrors::BookingNotInDispute,
    )]
    pub booking: Box<Account<'info, Booking>>,

    #[account(
        seeds = [b"dispute", booking.key().as_ref()],
        bump = dispute.bump,
        constraint = dispute.booking == booking.key() @ StaykeErrors::DisputeNotFound,
        constraint = dispute.status == DisputeStatus::Open @ StaykeErrors::BookingNotInDispute,
    )]
    pub dispute: Account<'info, Dispute>,

    #[account(
        mut,
        seeds = [b"escrow", booking.key().as_ref()],
        bump = booking.escrow_bump,
        token::mint = mint,
        token::authority = booking,
    )]
    pub escrow_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = host_token_account.key() == config.platform_vault @ StaykeErrors::InvalidTokenAccount,
    )]
    pub host_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = guest_token_account.key() == config.platform_vault @ StaykeErrors::InvalidTokenAccount,
    )]
    pub guest_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = platform_vault_token_account.key() == config.platform_vault @ StaykeErrors::InvalidTreasuryAccount,
    )]
    pub platform_vault_token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = mint.key() == config.usdc_mint @ StaykeErrors::InvalidTokenMint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn ins_resolve_dispute(
    ctx: Context<ResolveDispute>,
    host_share_bps: u16,
    rejected: bool,
) -> Result<()> {
    require!(
        host_share_bps <= 10_000,
        StaykeErrors::InvalidResolutionShares
    );

    let booking = &mut ctx.accounts.booking;
    let config = &ctx.accounts.config;
    let decimals = ctx.accounts.mint.decimals;
    let total = booking.total_price;

    let fee = (total as u128)
        .saturating_mul(config.fee_bps as u128)
        .saturating_div(10_000) as u64;
    let distributable = total.saturating_sub(fee);

    let host_amount = if rejected {
        distributable
    } else {
        (distributable as u128)
            .saturating_mul(host_share_bps as u128)
            .saturating_div(10_000) as u64
    };
    let guest_amount = distributable.saturating_sub(host_amount);

    let booking_seeds: &[&[&[u8]]] = &[&[
        b"booking",
        booking.property.as_ref(),
        booking.guest.as_ref(),
        &booking.check_in.to_le_bytes(),
        &[booking.bump],
    ]];

    if host_amount > 0 {
        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                *ctx.accounts.token_program.key,
                TransferChecked {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.host_token_account.to_account_info(),
                    authority: booking.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                booking_seeds,
            ),
            host_amount,
            decimals,
        )?;
    }

    if guest_amount > 0 {
        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                *ctx.accounts.token_program.key,
                TransferChecked {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.guest_token_account.to_account_info(),
                    authority: booking.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                booking_seeds,
            ),
            guest_amount,
            decimals,
        )?;
    }

    if fee > 0 {
        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                *ctx.accounts.token_program.key,
                TransferChecked {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.platform_vault_token_account.to_account_info(),
                    authority: booking.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                booking_seeds,
            ),
            fee,
            decimals,
        )?;
    }

    token_interface::close_account(CpiContext::new_with_signer(
        *ctx.accounts.token_program.key,
        CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.admin.to_account_info(),
            authority: booking.to_account_info(),
        },
        booking_seeds,
    ))?;

    // Marca la resolución para que CloseDispute pueda verificarla
    booking.status = if rejected {
        BookingStatus::DisputeRejected
    } else {
        BookingStatus::DisputeResolved
    };

    Ok(())
}

// ---------------------------------------------------------------------------
// Close Dispute — actualiza estados y cierra accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct CloseDispute<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admins.contains(&admin.key()) @ StaykeErrors::UnauthorizedAdmin,
    )]
    pub config: Box<Account<'info, PlatformConfig>>,

    #[account(
        mut,
        close = admin,
        seeds = [
            b"booking",
            booking.property.as_ref(),
            booking.guest.as_ref(),
            booking.check_in.to_le_bytes().as_ref(),
        ],
        bump = booking.bump,
        constraint = (
            booking.status == BookingStatus::DisputeResolved ||
            booking.status == BookingStatus::DisputeRejected
        ) @ StaykeErrors::BookingNotInDispute,
    )]
    pub booking: Box<Account<'info, Booking>>,

    #[account(
        mut,
        close = admin,
        seeds = [b"dispute", booking.key().as_ref()],
        bump = dispute.bump,
        constraint = dispute.booking == booking.key() @ StaykeErrors::DisputeNotFound,
    )]
    pub dispute: Account<'info, Dispute>,

    #[account(
        mut,
        seeds = [b"user", host_profile.dni.as_ref()],
        bump = host_profile.bump,
        constraint = host_profile.key() == booking.host @ StaykeErrors::InvalidHost,
    )]
    pub host_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"user", guest_profile.dni.as_ref()],
        bump = guest_profile.bump,
        constraint = guest_profile.key() == booking.guest @ StaykeErrors::UnauthorizedUser,
    )]
    pub guest_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [
            b"property",
            booking.host.as_ref(),
            property.listing_id.to_le_bytes().as_ref(),
        ],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,
}

pub fn ins_close_dispute(ctx: Context<CloseDispute>) -> Result<()> {
    let booking = &ctx.accounts.booking;
    let new_status = booking.status.clone();
    let booking_key = booking.key();

    ctx.accounts.dispute.status = match new_status {
        BookingStatus::DisputeRejected => DisputeStatus::Rejected,
        _ => DisputeStatus::Resolved,
    };

    ctx.accounts.guest_profile.active_booking = None;
    ctx.accounts.host_profile.active_booking = None;
    ctx.accounts.property.booking_active = None;

    emit!(BookingUpdateStatus {
        status: new_status,
        booking: booking_key,
    });

    Ok(())
}
