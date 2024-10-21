use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, associated_token::mint = property_mint, associated_token::authority = authority)]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(mut, associated_token::mint = property_mint, associated_token::authority = to)]
    pub to_token_account: Account<'info, TokenAccount>,

    /// CHECK: Validar adequadamente no front-end ou via lógica adicional
    pub to: UncheckedAccount<'info>,

    #[account(mut)]
    pub property_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> TransferTokens<'info> {
    pub fn transfer_tokens(&mut self, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.from_token_account.to_account_info(),
            to: self.to_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }
}
