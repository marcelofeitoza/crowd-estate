use anchor_lang::prelude::*;

use crate::{Property, Proposal};

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = Proposal::INIT_SPACE,
        seeds = [b"proposal", proposer.key().as_ref(), property.key().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(mut)]
    pub property: Account<'info, Property>,

    pub system_program: Program<'info, System>,
}
