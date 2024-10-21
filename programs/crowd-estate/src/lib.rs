use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, MintTo, Transfer};
use std::str::FromStr;

mod contexts;
mod errors;
mod state;

pub use contexts::*;
pub use errors::*;
pub use state::*;

declare_id!("7JA2mxcVkWwJ6ccfD5rf5K979kSprp1drhG6LcjrwZCf");

#[program]
pub mod crowd_estate {
    use super::*;

    pub fn create_property(
        ctx: Context<CreateProperty>,
        property_name: String,
        total_tokens: u64,
        token_price_usdc: u64,
        token_symbol: String,
        bump: u8,
    ) -> Result<()> {
        require!(total_tokens > 0, Errors::InvalidTotalTokens);
        require!(token_price_usdc > 0, Errors::InvalidTokenPrice);
        require!(
            !property_name.is_empty() && property_name.len() <= 32,
            Errors::InvalidPropertyName
        );
        require!(
            !token_symbol.is_empty() && token_symbol.len() <= 3,
            Errors::InvalidTokenSymbol
        );

        let admin = ctx.accounts.admin.key();

        ctx.accounts.property.set_inner(Property {
            admin,
            property_name: property_name.as_bytes().to_vec(),
            total_tokens,
            available_tokens: total_tokens,
            token_price_usdc,
            mint: ctx.accounts.property_mint.key(),
            token_symbol: token_symbol.as_bytes().to_vec(),
            bump,
            dividends_total: 0,
            is_closed: false,
        });

        msg!("Creating property vault for property: {}", property_name);

        let cpi_accounts = MintTo {
            mint: ctx.accounts.property_mint.to_account_info(),
            to: ctx.accounts.property_vault.to_account_info(),
            authority: ctx.accounts.property.to_account_info(),
        };

        let seeds = &[
            b"property",
            admin.as_ref(),
            property_name.as_bytes(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::mint_to(cpi_ctx, total_tokens)?;

        msg!("Property created successfully with name: {}", property_name);

        Ok(())
    }

    pub fn mint_additional_tokens(ctx: Context<MintAdditionalTokens>, amount: u64) -> Result<()> {
        let property = &mut ctx.accounts.property;

        require!(
            property.admin == ctx.accounts.admin.key(),
            Errors::Unauthorized
        );

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.property_mint.to_account_info(),
            to: ctx.accounts.property_vault.to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::mint_to(cpi_ctx, amount)?;

        property.total_tokens = property
            .total_tokens
            .checked_add(amount)
            .ok_or(Errors::OverflowError)?;
        property.available_tokens = property
            .available_tokens
            .checked_add(amount)
            .ok_or(Errors::OverflowError)?;

        Ok(())
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.from_token_account.to_account_info(),
            to: ctx.accounts.to_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn invest_in_property(ctx: Context<InvestInProperty>, usdc_amount: u64) -> Result<()> {
        let property = &mut ctx.accounts.property;

        let tokens_to_purchase = usdc_amount / property.token_price_usdc;
        require!(tokens_to_purchase > 0, Errors::InsufficientAmount);

        require!(
            property.available_tokens >= tokens_to_purchase,
            Errors::NotEnoughTokens
        );

        // Transferindo USDC do investidor para a conta de USDC da propriedade
        let cpi_accounts = Transfer {
            from: ctx.accounts.investor_usdc_account.to_account_info(),
            to: ctx.accounts.property_usdc_account.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, usdc_amount)?;

        // Transferindo tokens da propriedade do vault para o investidor
        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.property_vault.to_account_info(),
            to: ctx
                .accounts
                .investor_property_token_account
                .to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, tokens_to_purchase)?;

        property.available_tokens -= tokens_to_purchase;

        ctx.accounts.investment_account.set_inner(Investor {
            investor: ctx.accounts.investor.key(),
            property: ctx.accounts.property.key(),
            tokens_owned: tokens_to_purchase,
            dividends_claimed: 0,
        });

        Ok(())
    }

    pub fn distribute_dividends(
        ctx: Context<DistributeDividends>,
        total_dividends: u64,
    ) -> Result<()> {
        ctx.accounts.property.dividends_total = ctx
            .accounts
            .property
            .dividends_total
            .checked_add(total_dividends)
            .ok_or(Errors::OverflowError)?;

        Ok(())
    }

    pub fn redeem_dividends(ctx: Context<RedeemDividends>) -> Result<()> {
        let property = &ctx.accounts.property;
        let investor_account = &mut ctx.accounts.investment_account;

        let dividend_per_token = property
            .dividends_total
            .checked_div(property.total_tokens)
            .ok_or(Errors::DivisionError)?;

        let total_dividends_due = investor_account
            .tokens_owned
            .checked_mul(dividend_per_token)
            .ok_or(Errors::MultiplicationError)?;

        let dividends_to_claim = total_dividends_due
            .checked_sub(investor_account.dividends_claimed)
            .ok_or(Errors::InvalidDividendsClaim)?;

        require!(dividends_to_claim > 0, Errors::NoDividendsToClaim);

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.property_usdc_account.to_account_info(),
            to: ctx.accounts.investor_usdc_account.to_account_info(),
            authority: ctx.accounts.property.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, dividends_to_claim)?;

        investor_account.dividends_claimed = investor_account
            .dividends_claimed
            .checked_add(dividends_to_claim)
            .ok_or(Errors::OverflowError)?;

        Ok(())
    }

    pub fn withdraw_investment(ctx: Context<WithdrawInvestment>) -> Result<()> {
        let property = &mut ctx.accounts.property;
        let investment_account = &mut ctx.accounts.investment_account;

        require!(!property.is_closed, Errors::PropertyClosed);

        let usdc_amount = investment_account
            .tokens_owned
            .checked_mul(property.token_price_usdc)
            .ok_or(Errors::MultiplicationError)?;

        let cpi_accounts_transfer = Transfer {
            from: ctx
                .accounts
                .investor_property_token_account
                .to_account_info(),
            to: ctx.accounts.property_vault.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        };
        let cpi_ctx_transfer = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_transfer,
        );
        token::transfer(cpi_ctx_transfer, investment_account.tokens_owned)?;

        property.available_tokens = property
            .available_tokens
            .checked_add(investment_account.tokens_owned)
            .ok_or(Errors::OverflowError)?;

        let seeds = &[
            b"property",
            property.admin.as_ref(),
            &property.property_name,
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts_usdc_transfer = Transfer {
            from: ctx.accounts.property_usdc_account.to_account_info(),
            to: ctx.accounts.investor_usdc_account.to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_ctx_usdc_transfer = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_usdc_transfer,
            signer_seeds,
        );
        token::transfer(cpi_ctx_usdc_transfer, usdc_amount)?;

        investment_account.tokens_owned = 0;
        investment_account.close(ctx.accounts.investor.to_account_info())?;

        Ok(())
    }

    pub fn close_property(ctx: Context<CloseProperty>) -> Result<()> {
        let property = &mut ctx.accounts.property;

        require!(!property.is_closed, Errors::PropertyClosed);
        require!(
            property.admin == ctx.accounts.admin.key(),
            Errors::Unauthorized
        );

        let cpi_accounts = Burn {
            mint: ctx.accounts.property_mint.to_account_info(),
            from: ctx.accounts.property_vault.to_account_info(),
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
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::burn(cpi_ctx, property.available_tokens)?;

        property.is_closed = true;

        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        description: String,
        proposal_type: ProposalType,
        new_admin: String,
        additional_tokens: u64,
    ) -> Result<()> {
        require!(description.len() <= 256, Errors::DescriptionTooLong);

        let mut description_bytes = [0u8; 256];
        description_bytes[..description.len()].copy_from_slice(description.as_bytes());

        let proposal_new_admin: Option<Pubkey>;
        let proposal_additional_tokens: Option<u64>;

        match proposal_type {
            ProposalType::ChangeAdmin => {
                require!(!new_admin.is_empty(), Errors::InvalidNewAdmin);
                let new_admin_key =
                    Pubkey::from_str(&new_admin).map_err(|_| Errors::InvalidNewAdmin)?;
                proposal_new_admin = Some(new_admin_key);
                proposal_additional_tokens = None;
            }
            ProposalType::MintAdditionalTokens => {
                require!(additional_tokens > 0, Errors::InvalidAdditionalTokens);
                proposal_new_admin = None;
                proposal_additional_tokens = Some(additional_tokens);
            }
        }

        ctx.accounts.proposal.set_inner(Proposal {
            proposer: ctx.accounts.proposer.key(),
            property: ctx.accounts.property.key(),
            description: description_bytes,
            votes_for: 0,
            votes_against: 0,
            is_executed: false,
            proposal_type: proposal_type.clone() as u8,
            new_admin: proposal_new_admin,
            additional_tokens: proposal_additional_tokens,
        });

        Ok(())
    }

    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote: bool, // true for yes, false for no
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;

        require!(!proposal.is_executed, Errors::ProposalAlreadyExecuted);
        require!(!vote_record.voted, Errors::AlreadyVoted);

        if vote {
            proposal.votes_for = proposal
                .votes_for
                .checked_add(1)
                .ok_or(Errors::OverflowError)?;
        } else {
            proposal.votes_against = proposal
                .votes_against
                .checked_add(1)
                .ok_or(Errors::OverflowError)?;
        }

        vote_record.voted = true;

        Ok(())
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;

        require!(!proposal.is_executed, Errors::ProposalAlreadyExecuted);
        require!(
            proposal.votes_for > proposal.votes_against,
            Errors::ProposalNotApproved
        );

        match proposal.proposal_type {
            0 => {
                let admin = ctx.accounts.admin.key();

                ctx.accounts.property.available_tokens = ctx
                    .accounts
                    .property
                    .available_tokens
                    .checked_add(proposal.additional_tokens.unwrap())
                    .ok_or(Errors::OverflowError)?;
                ctx.accounts.property.total_tokens = ctx
                    .accounts
                    .property
                    .total_tokens
                    .checked_add(proposal.additional_tokens.unwrap())
                    .ok_or(Errors::OverflowError)?;

                let cpi_accounts = MintTo {
                    mint: ctx.accounts.property_mint.to_account_info(),
                    to: ctx.accounts.property_vault.to_account_info(),
                    authority: ctx.accounts.admin.to_account_info(),
                };

                let seeds = &[
                    b"property",
                    admin.as_ref(),
                    &ctx.accounts.property.property_name,
                    &[ctx.accounts.property.bump],
                ];
                let signer_seeds = &[&seeds[..]];

                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer_seeds,
                );
                token::mint_to(cpi_ctx, proposal.additional_tokens.unwrap())?;
            }
            1 => {
                ctx.accounts.property.admin = proposal.new_admin.unwrap();
            }
            _ => {
                return Err(Errors::InvalidProposalType.into());
            }
        }

        proposal.is_executed = true;

        Ok(())
    }
}
