use anchor_lang::prelude::error_code;

#[error_code]
pub enum StaykeErrors {
    // User profile errors
    #[msg("Only the user can modify their profile")]
    UnauthorizedUser,
    #[msg("User is banned")]
    UserBanned,
    #[msg("User is not verified")]
    UserNotVerified,
    #[msg("User is not a host")]
    UserNotHost,
    #[msg("User does not have enough deposit to perform this action")]
    InsufficientDeposit,

    // Property Errors
    #[msg("Property is currently in an active booking and cannot be modified")]
    PropertyInActiveBooking,
    #[msg("Only the host can modify their property")]
    UnauthorizedHost,
    #[msg("No properties to modify")]
    NoPropertiesToModify,

    // BookingErrors
    #[msg("Only the client can make a booking for themselves")]
    UnauthorizedBooking,
    #[msg("Invalid booking status for this action")]
    InvalidBookingStatus,
    #[msg("Invalid booking dates: check-in must be before check-out")]
    InvalidBookingDates,
    #[msg("Dates already booked for this property")]
    DatesAlreadyBooked,
    #[msg("Dates unbooked this property")]
    DatesUnbooked,
    #[msg("Invalid booking days account for the given dates")]
    InvalidBookingDaysAccount,
    #[msg("Host cannot book their own property")]
    HostCannotBookOwnProperty,
    #[msg("Invalid host for this property")]
    InvalidHost,
    #[msg("Invalid month")]
    InvalidMonth,
    #[msg("Unitialized booking days accounts")]
    UnitializedBookingDays,
    #[msg("Invalid booking property")]
    InvalidBookingProperty,
    #[msg("Too early to activate booking. Minimun 1 day left")]
    TooEarlyToActivate,

    // Close accounts
    #[msg("Wrong guess passed")]
    WrongGuessPassed,

    // DisputeErrors
    #[msg("Dispute not found")]
    DisputeNotFound,

    // AdminErrors
    #[msg("Unauthorized admin action")]
    UnauthorizedAdmin,

    // ConfigErrors
    #[msg("Configuration already initialized")]
    ConfigAlreadyInitialized,
    #[msg("Max admins reached")]
    MaxAdminsReached,
    #[msg("Cannot remove self from admins")]
    CannotRemoveSelf,
    #[msg("At least one admin is required")]
    AtLeastOneAdminRequired,
    #[msg("Admin to remove not found")]
    AdminNotFound,

    // DepositErrors
    #[msg("Deposit amount is below the minimum required")]
    DepositTooLow,
    #[msg("The treasury account is not the expected one")]
    InvalidTreasuryAccount,
    #[msg("The token mint does not match the configured USDC mint")]
    InvalidTokenMint,

    // WithdrawErrors
    #[msg("User has an active booking and cannot withdraw their guarantee")]
    WithdrawWithActiveBooking,
    #[msg("Insufficient guarantee balance to withdraw the requested amount")]
    InsufficientDepositBalance,

    // CompleteStayErrors
    #[msg("Booking must be in Active status to complete the stay")]
    BookingNotActive,

    // VerifyErrors
    #[msg("User is already verified")]
    AlreadyVerified,

    // DisputeErrors (extra)
    #[msg("Caller is not a party to this booking")]
    NotAPartyToBooking,
    #[msg("Booking must be in Disputed status to resolve")]
    BookingNotInDispute,
    #[msg("Host share must be between 0 and 10000 basis points")]
    InvalidResolutionShares,

    // ConfigurationBPS
    #[msg("Invalid retribution basis points")]
    InvalidRetributionBps,
    #[msg("Invalid fee basis points")]
    InvalidFeeBps,

    // ScoreErrors
    #[msg("Invalid score. Must be between 1 and 5")]
    InvalidScore,

    // TokenAccountErrors
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}
