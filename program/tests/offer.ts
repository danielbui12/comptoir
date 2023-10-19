import "mocha";
import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import { TOKEN_PROGRAM_ID, createMint as createMintToken } from "@solana/spl-token";
import assert from "assert";
import { confirmTx, nft_data } from "../utils/helper";
import { mintNFT } from "../utils/utils";
import { Comptoir, Collection, getBuyOfferPDA, getCollectionPDA, getEscrowPDA } from "../comptoirjs";


let provider = anchor.getProvider()
anchor.setProvider(provider);

describe('comptoir with mint', () => {
  let admin: web3.Keypair;
  let adminTokenAccount: web3.PublicKey;
  let creator: web3.Keypair;
  let creatorTokenAccount: web3.PublicKey;
  let buyer: web3.Keypair;
  let buyerTokenAccount: web3.PublicKey;
  let buyerNftTokenAccount: web3.PublicKey;
  let seller: web3.Keypair;
  let sellerTokenAccount: web3.PublicKey;
  let sellerNftTokenAccount: web3.PublicKey;
  let comptoirMint: web3.PublicKey;
  let nftMint: web3.PublicKey;

  let comptoir: Comptoir;
  let collection: Collection;

  const price = new anchor.BN(1000)

  it('Prepare tests variables', async () => {
    /////////////// INIT CREATOR ///////////////////
    creator = anchor.web3.Keypair.generate()
    let fromAirdropSignature = await provider.connection.requestAirdrop(
      creator.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTx(provider.connection, fromAirdropSignature);

    /////////////// INIT BUYER ///////////////////
    buyer = anchor.web3.Keypair.generate()
    fromAirdropSignature = await provider.connection.requestAirdrop(
      buyer.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTx(provider.connection, fromAirdropSignature);
    
    /////////////// INIT SELLER ///////////////////
    seller = anchor.web3.Keypair.generate()
    fromAirdropSignature = await provider.connection.requestAirdrop(
      seller.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTx(provider.connection, fromAirdropSignature);
    
    /////////////// INIT ADMIN ///////////////////
    admin = anchor.web3.Keypair.generate()
    fromAirdropSignature = await provider.connection.requestAirdrop(
      admin.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTx(provider.connection, fromAirdropSignature);
    
    /////////////// INIT TOKEN //////////////////
    comptoirMint = await createMintToken(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      7,
    );
    
    /////////////// INIT PDA //////////////////
    creatorTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator,
      comptoirMint,
      creator.publicKey,
    )).address;

    buyerTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      creator,
      comptoirMint,
      buyer.publicKey,
    )).address;

    sellerTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      seller,
      comptoirMint,
      seller.publicKey,
    )).address;

    adminTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      comptoirMint,
      admin.publicKey,
    )).address;
    
    /////////////// MINT NFT //////////////////
    const metadata = nft_data(creator.publicKey);
    const { mint } = await mintNFT(
      provider.connection,
      creator,
      metadata,
    );
    nftMint = mint
    
    /////////////// INIT PDA //////////////////
    buyerNftTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      nftMint,
      buyer.publicKey,
    )).address
    sellerNftTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      seller,
      nftMint,
      seller.publicKey
    )).address
    const ata = await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      comptoirMint,
      buyer.publicKey,
    )
    await splToken.mintTo(provider.connection, buyer, comptoirMint, ata.address, admin, price)
   
    comptoir = new Comptoir(provider)
    await comptoir.createComptoir(admin, comptoirMint, 500, adminTokenAccount)
    await comptoir.createCollection(admin, "aurorian", creator.publicKey, "AURY", false)

    const collectionPDA = getCollectionPDA(comptoir.comptoirPDA, "aurorian")
    collection = new Collection(provider, collectionPDA, comptoir)
  });


  it('remove nft offer', async () => {
    await collection.createBuyOffer(
      nftMint,
      price,
      buyerNftTokenAccount,
      buyerTokenAccount,
      buyer,
    )

    const escrowPDA = getEscrowPDA(comptoir.comptoirPDA, comptoirMint)
    const buyOfferPDA = getBuyOfferPDA(
      comptoir.comptoirPDA,
      buyer.publicKey,
      nftMint,
      price,
    )
    await collection.removeBuyOffer(
      buyOfferPDA,
      buyerTokenAccount,
      buyer,
    )
    
    const escrowAccount = await splToken.getAccount(provider.connection, escrowPDA)
    assert.equal(escrowAccount.amount, 0);
    const updatedBuyerAccount = await splToken.getAccount(provider.connection, buyerTokenAccount)
    assert.equal(updatedBuyerAccount.amount, Number(price));

    const closedBuyOffer = await provider.connection.getAccountInfo(buyOfferPDA);
    assert.equal(closedBuyOffer, null);
  });

  it('create nft offer', async () => {
    await collection.createBuyOffer(
      nftMint,
      price,
      buyerNftTokenAccount,
      buyerTokenAccount,
      buyer,
    )

    const escrowPDA = getEscrowPDA(comptoir.comptoirPDA, comptoirMint)
    const buyOfferPDA = getBuyOfferPDA(
      comptoir.comptoirPDA,
      buyer.publicKey,
      nftMint,
      price,
    )
    const buyOffer = await comptoir.program.account.buyOffer.fetch(buyOfferPDA)
    assert.equal(buyOffer.comptoir.toString(), comptoir.comptoirPDA.toString());
    assert.equal(buyOffer.mint.toString(), nftMint.toString());
    assert.equal(buyOffer.proposedPrice.toString(), "1000");
    assert.equal(buyOffer.authority.toString(), buyer.publicKey.toString());
    assert.equal(buyOffer.destination.toString(), buyerNftTokenAccount.toString());

    const escrowAccount = await splToken.getAccount(provider.connection, escrowPDA)
    assert.equal(escrowAccount.amount, 1000);

    const updatedBuyerAccount = await splToken.getAccount(provider.connection, buyerTokenAccount)
    assert.equal(updatedBuyerAccount.amount, 0);
  });

  // it('execute nft offer', async () => {
  //   let escrowPDA = await getEscrowPDA(comptoir.comptoirPDA, comptoirMint.publicKey)
  //   let buyOfferPDA = await getBuyOfferPDA(
  //     comptoir.comptoirPDA,
  //     buyer.publicKey,
  //     nftMint.publicKey,
  //     new anchor.BN(1000),
  //   )

  //   await collection.executeOffer(
  //     nftMint.publicKey,
  //     buyOfferPDA,
  //     buyer.publicKey,
  //     buyerNftTokenAccount,
  //     sellerTokenAccount,
  //     sellerNftTokenAccount,
  //     seller,
  //   )

  //   let escrowAccount = await comptoirMint.getAccountInfo(escrowPDA)
  //   assert.equal(escrowAccount.amount, 0);

  //   let updatedBuyerAccount = await comptoirMint.getAccountInfo(buyerTokenAccount)
  //   assert.equal(updatedBuyerAccount.amount.toNumber(), 0);

  //   let updatedBuyerNftAccount = await nftMint.getAccountInfo(buyerNftTokenAccount)
  //   assert.equal(updatedBuyerNftAccount.amount.toNumber(), 1);

  //   let updatedSellerAccount = await comptoirMint.getAccountInfo(sellerTokenAccount)
  //   assert.equal(updatedSellerAccount.amount.toNumber(), 850);

  //   let updatedSellerNftAccount = await nftMint.getAccountInfo(sellerNftTokenAccount)
  //   assert.equal(updatedSellerNftAccount.amount.toNumber(), 4);

  //   let updatedComptoirDestinationAccount = await comptoirMint.getAccountInfo(adminTokenAccount)
  //   assert.equal(updatedComptoirDestinationAccount.amount.toNumber(), 50);

  //   let updatedCreator = await comptoirMint.getAccountInfo(creatorTokenAccount)
  //   assert.equal(updatedCreator.amount.toNumber(), 100);

  //   let closedBuyOffer = await provider.connection.getAccountInfo(buyOfferPDA);
  //   assert.equal(closedBuyOffer, null);
  // });
});
