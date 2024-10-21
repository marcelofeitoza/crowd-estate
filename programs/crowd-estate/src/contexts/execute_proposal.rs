use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::{Property, Proposal};

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub new_admin: Option<Signer<'info>>,

    #[account(mut)]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub property_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = property_mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ExecuteProposal<'info> {
    pub fn execute_proposal(&mut self) -> Result<()> {
        let proposal = &mut self.proposal;

        require!(
            !proposal.is_executed,
            crate::errors::Errors::ProposalAlreadyExecuted
        );
        require!(
            proposal.votes_for > proposal.votes_against,
            crate::errors::Errors::ProposalNotApproved
        );

        match proposal.proposal_type {
            0 => {
                let admin = self.admin.key();

                self.property.available_tokens = self
                    .property
                    .available_tokens
                    .checked_add(proposal.additional_tokens.unwrap())
                    .ok_or(crate::errors::Errors::OverflowError)?;
                self.property.total_tokens = self
                    .property
                    .total_tokens
                    .checked_add(proposal.additional_tokens.unwrap())
                    .ok_or(crate::errors::Errors::OverflowError)?;

                let cpi_accounts = MintTo {
                    mint: self.property_mint.to_account_info(),
                    to: self.property_vault.to_account_info(),
                    authority: self.property.to_account_info(),
                };

                let seeds = &[
                    b"property",
                    admin.as_ref(),
                    &self.property.property_name,
                    &[self.property.bump],
                ];
                let signer_seeds = &[&seeds[..]];

                let cpi_ctx = CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    cpi_accounts,
                    signer_seeds,
                );
                token::mint_to(cpi_ctx, proposal.additional_tokens.unwrap())?;
            }
            1 => {
                self.property.admin = self.new_admin.as_ref().unwrap().key();
            }
            _ => {
                return Err(crate::errors::Errors::InvalidProposalType.into());
            }
        }

        proposal.is_executed = true;

        Ok(())
    }
}
