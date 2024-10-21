use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::Property;

#[derive(Accounts)]
#[instruction(total_dividends: u64)]
pub struct DistributeDividends<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut)]
    pub admin_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub property: Account<'info, Property>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
