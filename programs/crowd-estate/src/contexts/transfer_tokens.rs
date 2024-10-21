use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, associated_token::mint = property_mint, associated_token::authority = authority)]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(mut, associated_token::mint = property_mint, associated_token::authority = to)]
    pub to_token_account: Account<'info, TokenAccount>,

    /// CHECK: Validar adequadamente no front-end ou via lógica adicional
    pub to: UncheckedAccount<'info>,

    #[account(mut)]
    pub property_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
