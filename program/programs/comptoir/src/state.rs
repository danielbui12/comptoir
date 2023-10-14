use anchor_lang::prelude::*;

#[account]
pub struct Comptoir {
    pub fees: u16,
    pub fees_destination: Pubkey,
    pub authority: Pubkey,
    pub mint: Pubkey,
}

#[account]
pub struct SellOrder {
    pub comptoir: Pubkey,
    pub price: u64,
    pub quantity: u64,
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub destination: Pubkey,
}

#[account]
pub struct Collection {
    pub comptoir_key: Pubkey,
    pub name: String,
    pub symbol: String,
    pub required_verifier: Pubkey,
    pub fees: Option<u16>, //Takes priority over comptoir fees
    pub ignore_creator_fee: bool,
}

#[account]
pub struct BuyOffer {
    pub comptoir: Pubkey,
    pub mint: Pubkey,
    pub proposed_price: u64,
    pub authority: Pubkey,
    pub destination: Pubkey,
}
