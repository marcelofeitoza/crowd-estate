use anchor_lang::prelude::*;

#[account]
pub struct Proposal {
    pub proposer: Pubkey,
    pub property: Pubkey,
    pub description: [u8; 256],
    pub votes_for: u64,
    pub votes_against: u64,
    pub is_executed: bool,
    pub proposal_type: u8,
    pub new_admin: Option<Pubkey>,
    pub additional_tokens: Option<u64>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum ProposalType {
    MintAdditionalTokens, // 0
    ChangeAdmin,          // 1
}

impl Proposal {
    pub const INIT_SPACE: usize = 8   // discriminator
                                + 32  // property
                                + 32  // proposer
                                + 256 // description
                                + 8   // votes_for
                                + 8   // votes_against
                                + 1   // is_executed
                                + 1   // proposal_type
                                + 32  // new_admin
                                + 8; // additional_tokens
}
