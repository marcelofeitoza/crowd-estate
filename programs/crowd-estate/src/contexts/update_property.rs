use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::Property;

#[derive(Accounts)]
#[instruction(property_name: String, total_tokens: u64, token_price_usdc: u64, token_symbol: String, bump: u8)]
pub struct UpdateProperty<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        mint::decimals = 0,
        mint::authority = property,
        mint::token_program = token_program
    )]
    pub property_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = property_mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> UpdateProperty<'info> {
    pub fn update_property(&mut self, property_name: String, token_symbol: String) -> Result<()> {
        require!(
            !property_name.is_empty() && property_name.len() <= 32,
            crate::errors::Errors::InvalidPropertyName
        );
        require!(
            !token_symbol.is_empty() && token_symbol.len() <= 8,
            crate::errors::Errors::InvalidTokenSymbol
        );

        self.property.property_name = property_name.into();
        self.property.token_symbol = token_symbol.into();

        Ok(())
    }
}
