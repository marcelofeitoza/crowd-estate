use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::{Investor, Property};

#[derive(Accounts)]
pub struct InvestInProperty<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(mut)]
    pub investor_usdc_account: Account<'info, TokenAccount>,

    #[account(
        init,
        seeds = [b"investment", investor.key().as_ref(), property.key().as_ref()],
        bump,
        payer = investor,
        space = Investor::INIT_SPACE,
    )]
    pub investment_account: Account<'info, Investor>,

    #[account(
        mut,
        seeds = [b"property", admin.key().as_ref(), &property.property_name],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub property_mint: Account<'info, Mint>,

    #[account(mut)]
    pub property_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = property_mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = property_mint,
        associated_token::authority = investor,
    )]
    pub investor_property_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> InvestInProperty<'info> {
    pub fn invest_in_property(&mut self, usdc_amount: u64) -> Result<()> {
        let property = &mut self.property;

        let tokens_to_purchase = usdc_amount / property.token_price_usdc;
        require!(tokens_to_purchase > 0, crate::errors::Errors::InsufficientAmount);

        require!(
            property.available_tokens >= tokens_to_purchase,
            crate::errors::Errors::NotEnoughTokens
        );

        let cpi_accounts = Transfer {
            from: self.investor_usdc_account.to_account_info(),
            to: self.property_usdc_account.to_account_info(),
            authority: self.investor.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, usdc_amount)?;

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: self.property_vault.to_account_info(),
            to: self.investor_property_token_account.to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, tokens_to_purchase)?;

        property.available_tokens -= tokens_to_purchase;

        self.investment_account.set_inner(Investor {
            investor: self.investor.key(),
            property: self.property.key(),
            tokens_owned: tokens_to_purchase,
            dividends_claimed: 0,
        });

        Ok(())
    }
}