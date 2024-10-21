use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Property is closed")]
    PropertyClosed,
    #[msg("Property not closed")]
    PropertyNotClosed,
    #[msg("Tokens remain")]
    TokensRemain,
    #[msg("No tokens owned")]
    NoTokensOwned,
    #[msg("Invalid total tokens")]
    InvalidTotalTokens,
    #[msg("Invalid token price")]
    InvalidTokenPrice,
    #[msg("Invalid property name")]
    InvalidPropertyName,
    #[msg("Invalid token symbol")]
    InvalidTokenSymbol,
    #[msg("Insufficient amount")]
    InsufficientAmount,
    #[msg("Not enough tokens")]
    NotEnoughTokens,
    #[msg("Division error")]
    DivisionError,
    #[msg("Multiplication error")]
    MultiplicationError,
    #[msg("Overflow error")]
    OverflowError,
    #[msg("Invalid dividends claim")]
    InvalidDividendsClaim,
    #[msg("No dividends to claim")]
    NoDividendsToClaim,
    #[msg("Tokens still invested")]
    TokensStillInvested,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    #[msg("Proposal already voted")]
    AlreadyVoted,
    #[msg("Proposal not approved")]
    ProposalNotApproved,
    #[msg("Invalid proposal type")]
    InvalidProposalType,
    #[msg("Invalid new admin")]
    InvalidNewAdmin,
    #[msg("Invalid additional tokens")]
    InvalidAdditionalTokens,
    #[msg("Invalid property")]
    InvalidProperty,
    #[msg("Tokens available yet")]
    TokensAvailable,
    #[msg("Investors exist")]
    InvestorsExist,
    #[msg("Dividends exist")]
    DividendsExist,
}
