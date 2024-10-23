use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::Token};

use crate::Property;

#[derive(Accounts)]
#[instruction(token_symbol: String)]
pub struct UpdateProperty<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub property: Account<'info, Property>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> UpdateProperty<'info> {
    pub fn update_property(&mut self, token_symbol: String) -> Result<()> {
        require!(
            !token_symbol.is_empty() && token_symbol.len() <= 8,
            crate::errors::Errors::InvalidTokenSymbol
        );

        self.property.token_symbol = token_symbol.into();

        Ok(())
    }
}
