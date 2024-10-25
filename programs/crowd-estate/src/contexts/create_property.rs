use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

use crate::Property;

#[derive(Accounts)]
#[instruction(property_name: String, total_tokens: u64, token_price_usdc: u64, token_symbol: String, bump: u8)]
pub struct CreateProperty<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = Property::INIT_SPACE,
        seeds = [b"property", admin.key().as_ref(), property_name.as_bytes()],
        bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        mut,
        mint::decimals = 0,
        mint::authority = property,
        mint::token_program = token_program
    )]
    pub property_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = property_mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> CreateProperty<'info> {
    pub fn create_property(
        &mut self,
        property_name: String,
        total_tokens: u64,
        token_price_usdc: u64,
        token_symbol: String,
        bump: u8,
    ) -> Result<()> {
        require!(total_tokens > 0, crate::errors::Errors::InvalidTotalTokens);
        require!(
            token_price_usdc > 0,
            crate::errors::Errors::InvalidTokenPrice
        );
        require!(
            !property_name.is_empty() && property_name.len() <= 32,
            crate::errors::Errors::InvalidPropertyName
        );
        require!(
            !token_symbol.is_empty() && (token_symbol.len() <= 5 || token_symbol.len() >= 3),
            crate::errors::Errors::InvalidTokenSymbol
        );

        let admin = self.admin.key();

        self.property.set_inner(Property {
            admin,
            property_name: property_name.as_bytes().to_vec(),
            total_tokens,
            available_tokens: total_tokens,
            token_price_usdc,
            mint: self.property_mint.key(),
            token_symbol: token_symbol.as_bytes().to_vec(),
            bump,
            dividends_total: 0,
            is_closed: false,
        });

        msg!("Creating property vault for property: {}", property_name);

        let cpi_accounts = MintTo {
            mint: self.property_mint.to_account_info(),
            to: self.property_vault.to_account_info(),
            authority: self.property.to_account_info(),
        };

        let seeds = &[
            b"property",
            admin.as_ref(),
            property_name.as_bytes(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::mint_to(cpi_ctx, total_tokens)?;

        msg!("Property created successfully with name: {}", property_name);

        Ok(())
    }
}
