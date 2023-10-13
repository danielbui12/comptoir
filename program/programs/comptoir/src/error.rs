use anchor_lang::prelude::*;

#[error_code]
pub enum CommonErrorCode {
    #[msg("Fee should be <= 10000")]
    ErrFeeShouldLowerOrEqualThan10000,
    #[msg("Trying to unlist more than owned")]
    ErrTryingToUnlistMoreThanOwned,
    #[msg("Could not buy the required quantity of items")]
    ErrCouldNotBuyEnoughItem,
    #[msg("metadata mint does not match item mint")]
    ErrMetaDataMintDoesNotMatchItemMint,
    #[msg("nft not part of collection")]
    ErrNftNotPartOfCollection,
    #[msg("Derived key invalid")]
    DerivedKeyInvalid,
    #[msg("AccountNotInitialized")]
    NotInitialized
}
