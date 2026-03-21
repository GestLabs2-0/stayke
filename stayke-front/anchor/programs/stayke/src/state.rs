use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    #[max_len(10)]
    pub admins: Vec<Pubkey>,

    pub treasury: Pubkey,
    pub escrow_treasury: Pubkey,

    pub usdc_mint: Pubkey,

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

    pub is_banned: bool,

    pub active_booking: Option<Pubkey>, // Indicates if the user is currently in an active booking as client or host to prevent modifications

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
    pub booking_active: Option<Pubkey>, // Client booking this property is currently active with, if any. This is used to prevent modifications to the property while a booking is active.
    pub bump: u8,                       // Bump for PDA
}

#[account]
#[derive(InitSpace)]
pub struct BookingList {
    pub property: Pubkey,
    pub occupied_days: u32, // We are performing bitwise operations with this, so we can only support up to 32 days per month. This is a reasonable assumption for a booking system.
    pub month: u8,
    pub year: u16,
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
    pub review: u8, // Goes from 0 to 5, where 0 means no review and 1-5 are the actual ratings
    pub status: BookingStatus,
    pub bump: u8, // Bump for PDA
}

#[derive(InitSpace, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub enum BookingStatus {
    Pending,
    Active,
    Completed,
    Cancelled,
    Disputed,
}
