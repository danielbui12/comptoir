# Comptoir

## I. ABOUT:
Comptoir is an open source marketplace Solana program designed for on-chain assets. It provides creators from artists to video game builders with an easy way to create their own fully decentralised marketplace.
Think of it like Magic Eden or Solanart but open source.

Comptoir can be useful for a NFT / Video game in multiple ways : 

### :white_check_mark: Taking control over your fees by :
* Removing Middleman fees (Traditional marketplaces)
* Collection specific fees
* Ignoring creators fees

### :white_check_mark: Customize your front end

Given that comptoir is just a Solana program you can create your own front end to plug to it.
This allows for you to customize the way your assets are displayed adding stats, lore, user comments etc.

### :white_check_mark: Use your own currency

Unlike traditional marketplaces Comptoir allows you to trade in any SPL tokens. So if your game / ecosystem has one you can set it as a currency of the marketplace

### :white_check_mark: Buy Offer

We are planing to add a lot of features to Comptoir outside standard buying and selling.
The first one is the Buy Offer. If an item is not listed in the marketplace then one can create an offer for it.
Any seller owning that asset can then at any time accept the offer thus transferring the asset to the creator of the offer and receiving the funds.

## II. Requirement

- solana-cli v1.14.18
> If you face with this error `libssl.so.1.1: cannot open shared object file: No such file or directory`, just read [this answer](https://stackoverflow.com/a/72633324)
- node >=v16 <=v18

## III. Testing on localhost

### 1. Testing with Anchor only
I've configured `Anchor.toml` file, so feel free to start hacking, just run: 
```sh
$ anchor test
```

### 2. Testing with separated local validator

- Compiling:
```sh
$ anchor build

$ anchor keys list
# The new contract address will appear in terminal console. Please replace all contract address by the new one.
```


- Because Token, Associated Token, Metaplex are not available in localhost, so we've to clone it. [Following this answer](https://solana.stackexchange.com/a/1885)

```sh
$ solana program dump -u m TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA  program_modules/token_metadata_program.so

$ solana program dump -u m ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL program_modules/associated_token_metadata_program.so

$ solana program dump -u m metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s program_modules/metaplex_token_metadata_program.so
```

- Run local validator
```sh
$ solana-test-validator --bpf-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA program_modules/token_metadata_program.so --bpf-program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL program_modules/associated_token_metadata_program.so --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s program_modules/metaplex_token_metadata_program.so --reset
```

- Run test
```sh
$ anchor test --skip-local-validator
```

## Gitbook

To thoroughly understand the key concepts and get started creating your own marketplace check out the gitbook [here](https://aurory.gitbook.io/comptoir/)