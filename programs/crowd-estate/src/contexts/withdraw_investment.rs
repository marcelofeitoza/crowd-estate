use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

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

impl<'info> WithdrawInvestment<'info> {
    pub fn withdraw_investment(&mut self) -> Result<()> {
        let property = &mut self.property;
        let investment_account = &mut self.investment_account;

        require!(!property.is_closed, crate::errors::Errors::PropertyClosed);

        let usdc_amount = investment_account
            .tokens_owned
            .checked_mul(property.token_price_usdc)
            .ok_or(crate::errors::Errors::MultiplicationError)?;

        let cpi_accounts_transfer = Transfer {
            from: self.investor_property_token_account.to_account_info(),
            to: self.property_vault.to_account_info(),
            authority: self.investor.to_account_info(),
        };
        let cpi_ctx_transfer =
            CpiContext::new(self.token_program.to_account_info(), cpi_accounts_transfer);
        token::transfer(cpi_ctx_transfer, investment_account.tokens_owned)?;

        property.available_tokens = property
            .available_tokens
            .checked_add(investment_account.tokens_owned)
            .ok_or(crate::errors::Errors::OverflowError)?;

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts_usdc_transfer = Transfer {
            from: self.property_usdc_account.to_account_info(),
            to: self.investor_usdc_account.to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_ctx_usdc_transfer = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts_usdc_transfer,
            signer_seeds,
        );
        token::transfer(cpi_ctx_usdc_transfer, usdc_amount)?;

        investment_account.tokens_owned = 0;
        investment_account.close(self.investor.to_account_info())?;

        Ok(())
    }
}
