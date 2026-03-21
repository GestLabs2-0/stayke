use anchor_lang::prelude::{error_code, msg};

#[error_code]
pub enum UserProfileErrors {
    #[msg("User profile already exists")]
    UserProfileAlreadyExists,
    #[msg("User profile not found")]
    UserProfileNotFound,
    #[msg("User is currently in an active booking and cannot modify their profile")]
    UserInActiveBooking,
    #[msg("Only the user can modify their profile")]
    UnauthorizedUser,
    #[msg("User is banned and cannot perform this action")]
    UserBanned,
    #[msg("User is not verified and cannot perform this action")]
    UserNotVerified,
    #[msg("User is not a host and cannot perform this action")]
    UserNotHost,
    #[msg("User does not have enough deposit to perform this action")]
    InsufficientDeposit,
}

#[error_code]
pub enum PropertyErrors {
    #[msg("Property already exists")]
    PropertyAlreadyExists,
    #[msg("Property not found")]
    PropertyNotFound,
    #[msg("Property is currently in an active booking and cannot be modified")]
    PropertyInActiveBooking,
    #[msg("Only the host can modify their property")]
    UnauthorizedHost,
}

#[error_code]
pub enum DisputeErrors {
    #[msg("Dispute already exists for this booking")]
    DisputeAlreadyExists,
    #[msg("Dispute not found")]
    DisputeNotFound,
    #[msg("Only the client or host can raise a dispute")]
    UnauthorizedDispute,
    #[msg("Unauthorized resolution attempt by a non-admin")]
    UnauthorizedResolution,
}

#[error_code]
pub enum AdminErrors {
    #[msg("Unauthorized admin action")]
    Unauthorized,
}
