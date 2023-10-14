use anchor_lang::prelude::*;

#[event]
pub struct CreateSellOrderEvent {
  pub sell_order: Pubkey,
  pub price: u64,
  pub quantity: u64,
}

#[event]
pub struct RemoveSellOrderEvent {
  pub sell_order: Pubkey,
  pub quantity_to_unlist: u64
}

#[event]
pub struct BuyEvent {
  pub buyer: Pubkey,
  pub ask_quantity: u64,
  pub max_price: u64,
}

#[event]
pub struct BoughtSellOrderEvent {
  pub buyer: Pubkey,
  pub sell_order: Pubkey,
  pub quantity: u64,
  pub collection: Pubkey,
  pub metadata: Pubkey,
  pub comptoir: Pubkey,
}

#[event]
pub struct CreateBuyOfferEvent {
  pub buy_offer: Pubkey,
  pub price_proposition: u64,
}

#[event]
pub struct RemoveBuyOfferEvent {
  pub buy_offer: Pubkey,
}

#[event]
pub struct ExecuteOfferEvent {
  pub buy_offer: Pubkey,
}