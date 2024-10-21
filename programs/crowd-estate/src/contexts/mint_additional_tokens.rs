use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::Property;

#[derive(Accounts)]
pub struct MintAdditionalTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

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

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> MintAdditionalTokens<'info> {
    pub fn mint_additional_tokens(&mut self, amount: u64) -> Result<()> {
        let property = &mut self.property;

        require!(
            property.admin == self.admin.key(),
            crate::errors::Errors::Unauthorized
        );

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: self.property_mint.to_account_info(),
            to: self.property_vault.to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::mint_to(cpi_ctx, amount)?;

        property.total_tokens = property
            .total_tokens
            .checked_add(amount)
            .ok_or(crate::errors::Errors::OverflowError)?;
        property.available_tokens = property
            .available_tokens
            .checked_add(amount)
            .ok_or(crate::errors::Errors::OverflowError)?;

        Ok(())
    }
}
