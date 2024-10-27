use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

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

    #[account(mut)]
    pub property_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> DistributeDividends<'info> {
    pub fn distribute_dividends(&mut self, total_dividends: u64) -> Result<()> {
        let property = &mut self.property;

        require!(
            property.admin == self.admin.key(),
            crate::errors::Errors::Unauthorized
        );

        let cpi_accounts = Transfer {
            from: self.admin_usdc_account.to_account_info(),
            to: self.property_usdc_account.to_account_info(),
            authority: self.admin_usdc_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, total_dividends)?;

        property.dividends_total = property
            .dividends_total
            .checked_add(total_dividends)
            .ok_or(crate::errors::Errors::OverflowError)?;

        Ok(())
    }
}
