use anchor_lang::prelude::*;

#[account]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub voted: bool,
}

impl VoteRecord {
    pub const INIT_SPACE: usize = 8  // discriminator
                                + 32 // proposal
                                + 32 // voter
                                + 1; // voted
}
