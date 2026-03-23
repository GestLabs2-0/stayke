use anchor_lang::prelude::*;

use crate::state::BookingStatus;

#[event]
pub struct NewBookingEvent {
    pub guest: Pubkey,
    pub booking: Pubkey,
    pub property: Pubkey,
    pub host: Pubkey,
    pub status: BookingStatus,
    pub check_in: i64,
    pub check_out: i64,
}

#[event]
pub struct BookingUpdateStatus {
    pub booking: Pubkey,
    pub status: BookingStatus,
}
