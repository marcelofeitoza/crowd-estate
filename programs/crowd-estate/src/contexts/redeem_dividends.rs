use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{Investor, Property};

#[derive(Accounts)]
pub struct RedeemDividends<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(mut)]
    pub property_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub investor_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub investment_account: Account<'info, Investor>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
