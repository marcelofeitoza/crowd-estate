use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

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


impl<'info> RedeemDividends<'info> {
    pub fn redeem_dividends(&mut self) -> Result<()> {
        let property = &self.property;
        let investor_account = &mut self.investment_account;

        let dividend_per_token = property
            .dividends_total
            .checked_div(property.total_tokens)
            .ok_or(crate::errors::Errors::DivisionError)?;

        let total_dividends_due = investor_account
            .tokens_owned
            .checked_mul(dividend_per_token)
            .ok_or(crate::errors::Errors::MultiplicationError)?;

        let dividends_to_claim = total_dividends_due
            .checked_sub(investor_account.dividends_claimed)
            .ok_or(crate::errors::Errors::InvalidDividendsClaim)?;

        require!(dividends_to_claim > 0, crate::errors::Errors::NoDividendsToClaim);

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.property_usdc_account.to_account_info(),
            to: self.investor_usdc_account.to_account_info(),
            authority: self.property.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, dividends_to_claim)?;

        investor_account.dividends_claimed = investor_account
            .dividends_claimed
            .checked_add(dividends_to_claim)
            .ok_or(crate::errors::Errors::OverflowError)?;

        Ok(())
    }
}