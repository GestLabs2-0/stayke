mod errors;
mod instructions;
mod state;

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use instructions::{admin, initialize, properties, user_profile};

use crate::state::UserProfile;

#[cfg(test)]
mod tests;

declare_id!("BSX3yt7xpwNp8BtkJhDMv2Q1227pji3TpvSJWnnLENHg");

#[program]
pub mod stayke {
    use super::*;

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     INITIALIZE ACCOUNTS   -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn initialize_contract(
        ctx: Context<initialize::InitializeContract>,
        initial_data: initialize::InitialConfig,
    ) -> Result<()> {
        initialize::initialize_contract(ctx, initial_data)
    }

    pub fn register_user(ctx: Context<initialize::RegisterUser>, dni_hash: [u8; 32]) -> Result<()> {
        initialize::register_user(ctx, dni_hash)
    }

    pub fn register_property(
        ctx: Context<properties::InitProperty>,
        dni_hash: [u8; 32],
        listing_count: u8,
        price_per_night: u64,
    ) -> Result<()> {
        properties::register_property(ctx, dni_hash, listing_count, price_per_night)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     HOST FUNCTIONS        -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     ADMIN FUNCTIONS       -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn deposit_funds(
        ctx: Context<user_profile::Deposit>,
        amount: u64,
        decimals: u64,
    ) -> Result<()> {
        user_profile::deposit(ctx, amount, decimals)
    }

    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------
    // --------------------------     ADMIN FUNCTIONS       -----------------------------------
    // ----------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------

    pub fn add_admin(ctx: Context<admin::AddRemoveAdmin>, new_admin: Pubkey) -> Result<()> {
        admin::add_admin(ctx, new_admin)
    }

    pub fn remove_admin(
        ctx: Context<admin::AddRemoveAdmin>,
        admin_to_remove: Pubkey,
    ) -> Result<()> {
        admin::remove_admin(ctx, admin_to_remove)
    }
}
