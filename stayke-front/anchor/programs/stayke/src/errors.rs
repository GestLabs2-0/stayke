use anchor_lang::prelude::error_code;

#[error_code]
pub enum StaykeErrors {
    // User profile errors
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

    // Property Errors
    #[msg("Property already exists")]
    PropertyAlreadyExists,
    #[msg("Property not found")]
    PropertyNotFound,
    #[msg("Property is currently in an active booking and cannot be modified")]
    PropertyInActiveBooking,
    #[msg("Only the host can modify their property")]
    UnauthorizedHost,

    // BookingErrors
    #[msg("Booking already exists for this property")]
    BookingAlreadyExists,
    #[msg("Booking not found")]
    BookingNotFound,
    #[msg("Only the client can make a booking for themselves")]
    UnauthorizedBooking,
    #[msg("Only the host can confirm a booking for their property")]
    UnauthorizedConfirmation,
    #[msg("Only the client can complete a booking for themselves")]
    UnauthorizedCompletion,
    #[msg("Invalid booking dates: check-in must be before check-out")]
    InvalidBookingDates,
    #[msg("Dates already booked for this property")]
    DatesAlreadyBooked,

    // DisputeErrors
    #[msg("Dispute already exists for this booking")]
    DisputeAlreadyExists,
    #[msg("Dispute not found")]
    DisputeNotFound,
    #[msg("Only the client or host can raise a dispute")]
    UnauthorizedDispute,
    #[msg("Unauthorized resolution attempt by a non-admin")]
    UnauthorizedResolution,

    // AdminErrors
    #[msg("Unauthorized admin action")]
    UnauthorizedAdmin,

    // ConfigErrors
    #[msg("Configuration already initialized")]
    ConfigAlreadyInitialized,

    // DepositErrors
    #[msg("Deposit amount is below the minimum required")]
    DepositTooLow,
    #[msg("No active booking found for this user")]
    NoActiveBooking,
    #[msg("Only the client can make a deposit for their booking")]
    UnauthorizedDeposit,
    #[msg("The treasury account is not the expected one")]
    InvalidTreasuryAccount,
    #[msg("The token mint does not match the configured USDC mint")]
    InvalidTokenMint,
}
