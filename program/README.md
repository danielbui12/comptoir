# Comptoir

Comptoir is an open source marketplace Solana program designed for on-chain assets. It provides creators from artists to video game builders with an easy way to create their own fully decentralised marketplace.
Think of it like Magic Eden or Solanart but open source.

Comptoir can be useful for a NFT / Video game in multiple ways : 

### Taking control over your fees by :
* Removing Middleman fees (Traditional marketplaces)
* Collection specific fees
* Ignoring creators fees

### Customize your front end

Given that comptoir is just a Solana program you can create your own front end to plug to it.
This allows for you to customize the way your assets are displayed adding stats, lore, user comments etc.

### Use your own currency

Unlike traditional marketplaces Comptoir allows you to trade in any SPL tokens. So if your game / ecosystem has one you can set it as a currency of the marketplace

### Buy Offer

We are planing to add a lot of features to Comptoir outside standard buying and selling.
The first one is the Buy Offer. If an item is not listed in the marketplace then one can create an offer for it.
Any seller owning that asset can then at any time accept the offer thus transferring the asset to the creator of the offer and receiving the funds.

### Requirement

- solana v1.14.18
- node >=v16 <=v18
- Run test 
```sh
$ solana-test-validator --bpf-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA token_metadata_program.so --bpf-program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL associated_token_metadata_program.so --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s metaplex_token_metadata_program.so --reset

$ anchor test --skip-local-validator
```

## Gitbook

To understand the key concepts and get started creating your own marketplace check out the gitbook [here](https://aurory.gitbook.io/comptoir/)


https://solana.stackexchange.com/a/1885