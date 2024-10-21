use anchor_lang::prelude::*;

use crate::{Proposal, VoteRecord};

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init_if_needed,
        payer = voter,
        space = VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}
