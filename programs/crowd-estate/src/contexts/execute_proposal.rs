use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

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
