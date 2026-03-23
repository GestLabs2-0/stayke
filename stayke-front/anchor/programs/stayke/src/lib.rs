pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;

use instructions::{admin::*, booking::*, initialize::*, properties::*, user_profile::*};

#[cfg(test)]
mod tests;

declare_id!("GnzJGwApzby8BpL17fctpBZGCfk1C6FEauAhRg3VA2ac");

#[program]
pub mod stayke {
    use super::*;

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     INITIALIZE ACCOUNTS   -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn initialize_contract(
        ctx: Context<InitializeContract>,
        initial_data: InitialConfig,
    ) -> Result<()> {
        ins_initialize_contract(ctx, initial_data)
    }

    pub fn register_user(ctx: Context<RegisterUser>, dni_hash: [u8; 32]) -> Result<()> {
        ins_register_user(ctx, dni_hash)
    }

    pub fn register_property(ctx: Context<InitProperty>, price_per_night: u64) -> Result<()> {
        ins_register_property(ctx, price_per_night)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     HOST FUNCTIONS        -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn update_property_price(
        ctx: Context<ModifyProperty>,
        new_price_per_night: u64,
    ) -> Result<()> {
        ins_update_property_price(ctx, new_price_per_night)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     USER FUNCTIONS       -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn deposit_funds(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ins_deposit(ctx, amount)
    }

    pub fn set_host_status(
        ctx: Context<SetHostStatus>,
        dni_hash: [u8; 32],
        status: bool,
    ) -> Result<()> {
        ins_set_host_status(ctx, dni_hash, status)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     BOOKING FUNCTIONS     -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn create_booking(
        ctx: Context<CreateBooking>,
        check_in: i64,
        check_out: i64,
    ) -> Result<()> {
        ins_create_booking(ctx, check_in, check_out)
    }

    pub fn host_pending_accept(ctx: Context<HostPendingAccept>) -> Result<()> {
        ins_host_pending_accept(ctx)
    }

    pub fn host_pending_reject(ctx: Context<HostPendingReject>) -> Result<()> {
        ins_host_pending_reject(ctx)
    }

    pub fn accept_reserve(ctx: Context<ClientAcceptReserve>) -> Result<()> {
        ins_accept_reserve(ctx)
    }

    pub fn client_reject_reserve(ctx: Context<ClientRejectReserve>) -> Result<()> {
        ins_client_reject_reserve(ctx)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     ADMIN FUNCTIONS       -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn add_admin(ctx: Context<AddRemoveAdmin>, new_admin: Pubkey) -> Result<()> {
        ins_add_admin(ctx, new_admin)
    }

    pub fn remove_admin(ctx: Context<AddRemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
        ins_remove_admin(ctx, admin_to_remove)
    }
}
