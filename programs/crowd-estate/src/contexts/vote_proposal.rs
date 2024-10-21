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

impl<'info> VoteOnProposal<'info> {
    pub fn vote_on_proposal(&mut self, vote: bool) -> Result<()> {
        let proposal = &mut self.proposal;
        let vote_record = &mut self.vote_record;

        require!(!proposal.is_executed, crate::errors::Errors::ProposalAlreadyExecuted);
        require!(!vote_record.voted, crate::errors::Errors::AlreadyVoted);

        if vote {
            proposal.votes_for = proposal
                .votes_for
                .checked_add(1)
                .ok_or(crate::errors::Errors::OverflowError)?;
        } else {
            proposal.votes_against = proposal
                .votes_against
                .checked_add(1)
                .ok_or(crate::errors::Errors::OverflowError)?;
        }

        vote_record.voted = true;

        Ok(())
    }
}