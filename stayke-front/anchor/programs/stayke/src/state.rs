use anchor_lang::prelude::*;

use crate::utils::DateComponents;

pub const MAX_ADMINS: usize = 10;

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    #[max_len(MAX_ADMINS)]
    pub admins: Vec<Pubkey>,

    pub treasury: Pubkey,         // Token account whose authority is the PDA [b"treasury"]
    pub treasury_bump: u8,        // Bump of the treasury PDA (used to sign CPIs)

    pub platform_vault: Pubkey,      // Token account whose authority is the PDA [b"platform_vault"]
    pub platform_vault_bump: u8,     // Bump of the platform_vault PDA (used to sign CPIs)

    pub usdc_mint: Pubkey,

    pub fee_bps: u16,               // Platform fee in basis points (e.g. 500 = 5%)

    pub retribution_bps_low: u16,
    pub retribution_bps_medium: u16,
    pub retribution_bps_high: u16,

    pub minimum_deposit: u64,

    pub is_initialized: bool, // To prevent re-initialization of the contract

    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub owner: Pubkey, // The user's wallet address and manager of the profile
    pub deposit: u64,
    pub deposit_timestamp: i64,
    pub dni: [u8; 32],     // Hash of the user's DNI (or any unique identifier)
    pub is_verified: bool, // Indicates if the user has been verified by an authority TODO: Implement authority verification
    pub token_account: Pubkey, // The user's token account address

    pub is_banned: bool,

    pub active_booking: Option<Pubkey>, // Indicates if the user is currently in an active booking as client

    pub host_reviews: u32,     // Number of reviews received as host
    pub total_score_host: u64, // Total score from reviews (e.g., sum of ratings)

    pub client_reviews: u32,     // Number of reviews received as client
    pub total_score_client: u64, // Total score from reviews (e.g., sum of ratings)

    pub hosted_stays: u32,    // Number of stays hosted
    pub completed_stays: u32, // Number of stays completed as a guest

    pub is_host: bool, // Indicates if the user is a host or a guest

    pub low_infractions: u8,
    pub medium_infractions: u8,
    pub high_infractions: u8,

    pub listing_count: u8, // Number of properties listed by the user, used to generate unique seeds for properties

    pub bump: u8, // Bump for PDA
}

#[account]
#[derive(InitSpace)]
pub struct Property {
    pub host: Pubkey,
    pub listing_id: u8, // Unique identifier for the property, generated using the host's listing_count to ensure uniqueness per host
    pub price_per_night: u64,
    #[max_len(32)]
    pub hash_state: String,
    pub booking_active: Option<Pubkey>, // Pubkey for booking active
    pub bump: u8,                       // Bump for PDA
}

#[account]
#[derive(InitSpace)]
pub struct BookingDays {
    pub property: Pubkey,
    pub occupied_days: u32, // We are performing bitwise operations with this, so we can only support up to 32 days per month. This is a reasonable assumption for a booking system.
    pub month: u32,
    pub year: u32,
    pub initialized: bool, // To check if the account was already initialized and filled with data from a previous booking, to prevent double counting of occupied days when a new booking is made for the same property and month
    pub bump: u8,          // Bump for PDA
}

impl BookingDays {
    pub fn year_month(&self) -> u32 {
        self.year * 100 + self.month
    }
}

#[account]
#[derive(InitSpace)]
pub struct Booking {
    pub guest: Pubkey,
    pub host: Pubkey,
    pub property: Pubkey,
    pub deposit: u64,
    pub check_in: i64,
    pub check_out: i64,
    pub days: u64,
    pub check_in_date: DateComponents,
    pub check_out_date: DateComponents,
    pub total_price: u64,
    pub review: u8,          // Goes from 0 to 5, where 0 means no review and 1-5 are the actual ratings
    pub status: BookingStatus,
    pub escrow_bump: u8,     // Bump of the escrow token account PDA — needed to sign CPIs in complete_stay
    pub bump: u8,            // Bump for the booking PDA
}

#[derive(InitSpace, PartialEq, Eq, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum BookingStatus {
    Pending,         // The booking has been created by the guest but not yet accepted by the host
    HostAccepted,    // The host has accepted the booking but the guest has not yet checked in
    Active,          // The guest has checked in and the booking is active
    Completed,       // The guest has checked out and the booking is completed, pending review
    Cancelled,       // The booking has been cancelled by either the guest or the host before check-in
    Disputed,        // The booking is in dispute, pending resolution by the platform admins
    DisputeResolved, // The dispute has been resolved by the platform admins, pending review
    DisputeRejected, // The dispute has been rejected by the platform admins, pending review
}

// ---------------------------------------------------------------------------
// Dispute
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct Dispute {
    pub booking: Pubkey,        // The booking that is in dispute
    pub opened_by: Pubkey,      // The user (guest or host) who opened the dispute
    pub reason: DisputeReason,  // On-chain category of the dispute
    pub status: DisputeStatus,
    pub bump: u8,
}

#[derive(InitSpace, PartialEq, Eq, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum DisputeStatus {
    Open,
    Resolved, // Escrow released to one of the parties
    Rejected, // Dispute rejected by admin; booking proceeds as normal
}

/// General category of a dispute — kept on-chain as a permanent record.
#[derive(InitSpace, PartialEq, Eq, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum DisputeReason {
    PropertyNotAsDescribed, // Property doesn't match the listing
    CheckInIssues,          // Problems accessing the property at check-in
    CheckOutIssues,         // Host-side problems reported at check-out
    CleanlinessIssues,      // Property was not clean upon arrival
    NoShow,                 // Guest or host did not show up / was not reachable
    DamageClaim,            // Host claims the guest damaged the property
    RefundRequest,          // Guest requests a refund for a valid reason
    Other,                  // Catch-all for any other reason
}

/// Severity level used by `penalize_user`.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum PenaltySeverity {
    Low,
    Medium,
    High,
}


