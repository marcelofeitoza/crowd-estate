use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, self, Burn};

use crate::Property;

#[derive(Accounts)]
pub struct CloseProperty<'info> {
    #[account(
        mut, 
        close = admin, 
        has_one = admin, 
        constraint = !property.is_closed
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub admin_usdc_account: Account<'info, TokenAccount>,

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

impl<'info> CloseProperty<'info> {
    pub fn close_property(&mut self) -> Result<()> {
        let property = &mut self.property;

        require!(!property.is_closed, crate::errors::Errors::PropertyClosed);
        require!(
            property.admin == self.admin.key(),
            crate::errors::Errors::Unauthorized
        );

        let cpi_accounts = Burn {
            mint: self.property_mint.to_account_info(),
            from: self.property_vault.to_account_info(),
            authority: property.to_account_info(),
        };

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::burn(cpi_ctx, property.available_tokens)?;

        property.is_closed = true;

        Ok(())
    }
}