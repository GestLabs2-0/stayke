pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use instructions::{admin::*, initialize::*, properties::*, user_profile::*};

use crate::state::*;

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
        initialize_contract(ctx, initial_data)
    }

    pub fn register_user(ctx: Context<RegisterUser>, dni_hash: [u8; 32]) -> Result<()> {
        register_user(ctx, dni_hash)
    }

    pub fn register_property(
        ctx: Context<InitProperty>,
        dni_hash: [u8; 32],
        listing_count: u8,
        price_per_night: u64,
    ) -> Result<()> {
        register_property(ctx, dni_hash, listing_count, price_per_night)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     HOST FUNCTIONS        -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn update_property_price(
        ctx: Context<ModifyProperty>,
        dni_hash: [u8; 32],
        listing_count: u8,
        new_price_per_night: u64,
    ) -> Result<()> {
        update_property_price(ctx, dni_hash, listing_count, new_price_per_night)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     USER FUNCTIONS       -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn deposit_funds(
        ctx: Context<Deposit>,
        dni_hash: [u8; 32],
        amount: u64,
        decimals: u8,
    ) -> Result<()> {
        deposit(ctx, dni_hash, amount, decimals)
    }

    pub fn set_host_status(
        ctx: Context<SetHostStatus>,
        dni_hash: [u8; 32],
        status: bool,
    ) -> Result<()> {
        set_host_status(ctx, dni_hash, status)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     ADMIN FUNCTIONS       -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn add_admin(ctx: Context<AddRemoveAdmin>, new_admin: Pubkey) -> Result<()> {
        add_admin(ctx, new_admin)
    }

    pub fn remove_admin(ctx: Context<AddRemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
        remove_admin(ctx, admin_to_remove)
    }
}
