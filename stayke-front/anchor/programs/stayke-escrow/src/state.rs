pub struct UserProfile {
    pub owner: Pubkey, // The user's wallet address and manager of the profile
    pub deposit: u64,
    pub deposit_timestamp: i64,
    pub dni: [u8; 32],     // Hash of the user's DNI (or any unique identifier)
    pub is_verified: bool, // Indicates if the user has been verified by an authority TODO: Implement authority verification

    pub is_banned: bool,

    pub reviews: u32,       // Number of reviews received
    pub total_reviews: u64, // Total score from reviews (e.g., sum of ratings)

    pub hosted_stays: u32,    // Number of stays hosted
    pub completed_stays: u32, // Number of stays completed as a guest

    pub is_host: bool, // Indicates if the user is a host or a guest

    pub low_infractions: u8,
    pub medium_infractions: u8,
    pub high_infractions: u8,

    pub bump: u8, // Bump for PDA
}
