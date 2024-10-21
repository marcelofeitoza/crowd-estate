use anchor_lang::prelude::*;

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
        ctx.accounts.create_property(
            property_name,
            total_tokens,
            token_price_usdc,
            token_symbol,
            bump,
        )
    }

    pub fn mint_additional_tokens(ctx: Context<MintAdditionalTokens>, amount: u64) -> Result<()> {
        ctx.accounts.mint_additional_tokens(amount)
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        ctx.accounts.transfer_tokens(amount)
    }

    pub fn invest_in_property(ctx: Context<InvestInProperty>, usdc_amount: u64) -> Result<()> {
        ctx.accounts.invest_in_property(usdc_amount)
    }

    pub fn distribute_dividends(
        ctx: Context<DistributeDividends>,
        total_dividends: u64,
    ) -> Result<()> {
        ctx.accounts.distribute_dividends(total_dividends)
    }

    pub fn redeem_dividends(ctx: Context<RedeemDividends>) -> Result<()> {
        ctx.accounts.redeem_dividends()
    }

    pub fn withdraw_investment(ctx: Context<WithdrawInvestment>) -> Result<()> {
        ctx.accounts.withdraw_investment()
    }

    pub fn close_property(ctx: Context<CloseProperty>) -> Result<()> {
        ctx.accounts.close_property()
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        description: String,
        proposal_type: ProposalType,
        new_admin: String,
        additional_tokens: u64,
    ) -> Result<()> {
        ctx.accounts
            .create_proposal(description, proposal_type, new_admin, additional_tokens)
    }

    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote: bool, // true for yes, false for no
    ) -> Result<()> {
        ctx.accounts.vote_on_proposal(vote)
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        ctx.accounts.execute_proposal()
    }
}
