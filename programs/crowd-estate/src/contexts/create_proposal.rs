use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::{Property, Proposal, ProposalType};

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

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        description: String,
        proposal_type: ProposalType,
        new_admin: String,
        additional_tokens: u64,
    ) -> Result<()> {
        require!(
            description.len() <= 256,
            crate::errors::Errors::DescriptionTooLong
        );

        let mut description_bytes = [0u8; 256];
        description_bytes[..description.len()].copy_from_slice(description.as_bytes());

        let proposal_new_admin: Option<Pubkey>;
        let proposal_additional_tokens: Option<u64>;

        match proposal_type {
            ProposalType::ChangeAdmin => {
                require!(
                    !new_admin.is_empty(),
                    crate::errors::Errors::InvalidNewAdmin
                );
                let new_admin_key = Pubkey::from_str(&new_admin)
                    .map_err(|_| crate::errors::Errors::InvalidNewAdmin)?;
                proposal_new_admin = Some(new_admin_key);
                proposal_additional_tokens = None;
            }
            ProposalType::MintAdditionalTokens => {
                require!(
                    additional_tokens > 0,
                    crate::errors::Errors::InvalidAdditionalTokens
                );
                proposal_new_admin = None;
                proposal_additional_tokens = Some(additional_tokens);
            }
        }

        self.proposal.set_inner(Proposal {
            proposer: self.proposer.key(),
            property: self.property.key(),
            description: description_bytes,
            votes_for: 0,
            votes_against: 0,
            is_executed: false,
            proposal_type: proposal_type.clone() as u8,
            new_admin: proposal_new_admin,
            additional_tokens: proposal_additional_tokens,
        });

        Ok(())
    }
}
