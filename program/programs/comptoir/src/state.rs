use anchor_lang::prelude::*;

#[account]
pub struct Comptoir {
    fees: u16,
    fees_destination: Pubkey,
    authority: Pubkey,
    mint: Pubkey,
}

#[account]
pub struct SellOrder {
    comptoir: Pubkey,
    price: u64,
    quantity: u64,
    mint: Pubkey,
    authority: Pubkey,
    destination: Pubkey,
}

#[account]
pub struct Collection {
    comptoir_key: Pubkey,
    name: String,
    symbol: String,
    required_verifier: Pubkey,
    fees: Option<u16>, //Takes priority over comptoir fees
    ignore_creator_fee: bool,
}

#[account]
pub struct BuyOffer {
    comptoir: Pubkey,
    mint: Pubkey,
    proposed_price: u64,
    authority: Pubkey,
    destination: Pubkey,
}
