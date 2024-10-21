use anchor_lang::prelude::*;

#[account]
pub struct Investor {
    pub investor: Pubkey,
    pub property: Pubkey,
    pub tokens_owned: u64,
    pub dividends_claimed: u64,
}

impl Investor {
    pub const INIT_SPACE: usize = 8  // Discriminador
                                + 32 // investor
                                + 32 // property
                                + 8  // tokens_owned
                                + 8; // dividends_claimed
}
