use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{Investor, Property};

#[derive(Accounts)]
pub struct WithdrawInvestment<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub investor_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        close = investor,
        has_one = investor,
        has_one = property,
    )]
    pub investment_account: Account<'info, Investor>,

    #[account(
        mut,
        associated_token::mint = property_mint,
        associated_token::authority = investor,
    )]
    pub investor_property_token_account: Account<'info, TokenAccount>,

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
    pub property_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
