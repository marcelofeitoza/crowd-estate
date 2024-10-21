use anchor_lang::prelude::*;

#[account]
pub struct Property {
    pub property_name: Vec<u8>,
    pub total_tokens: u64,
    pub available_tokens: u64,
    pub token_price_usdc: u64,
    pub token_symbol: Vec<u8>,
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
    pub dividends_total: u64,
    pub is_closed: bool,
}

impl Property {
    pub const INIT_SPACE: usize = 8  // discriminator
                                + 32 // property_name
                                + 8  // total_tokens
                                + 8  // available_tokens
                                + 8  // token_price_usdc
                                + 32 // token_symbol
                                + 32 // admin
                                + 32 // mint
                                + 1  // bump
                                + 8  // dividends_total
                                + 1; // is_closed
}
