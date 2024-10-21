use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::Property;

#[derive(Accounts)]
#[instruction(property_name: String, total_tokens: u64, token_price_usdc: u64, token_symbol: String, bump: u8)]
pub struct CreateProperty<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Property::INIT_SPACE,
        seeds = [b"property", admin.key().as_ref(), property_name.as_bytes()],
        bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        mint::decimals = 0,
        mint::authority = property,
        mint::token_program = token_program
    )]
    pub property_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = property_mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
