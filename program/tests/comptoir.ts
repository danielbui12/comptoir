import "mocha";
import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import { PublicKey } from "@solana/web3.js";
import assert from "assert";
import { confirmTx, nft_data } from "../utils/helper";
import { mintNFT } from "../utils/utils";
import { Collection, Comptoir, getCollectionPDA, getComptoirPDA, getEscrowPDA } from "../comptoirjs";

let provider = anchor.getProvider()
anchor.setProvider(provider);

describe('comptoir with mint', () => {
  let admin: web3.Keypair;
  let adminTokenAccount: web3.PublicKey;
  let creator: web3.Keypair;
  let creatorTokenAccount: web3.PublicKey;
  let seller: web3.Keypair;
  let sellerTokenAccount: web3.PublicKey;
  let sellerNftTokenAccount: PublicKey;
  let comptoirMint: web3.PublicKey;
  let comptoir: Comptoir;
  let collection: Collection;
  let collectionFee = 500;
  let nftMint: web3.PublicKey;
  let metadataPDA: PublicKey;
  let programNftVaultPDA: PublicKey;
  let sellOrderPDA: PublicKey;
  let escrowPDA: PublicKey;

  const fee = 200;
  const collectionName = "aurorian"
  const collectionSymbol = "AURY"
  const feeAbove1000 = 10001;

  it('Prepare tests variables', async () => {
    /////////////// INIT CREATOR ///////////////////
    creator = anchor.web3.Keypair.generate()
    let fromAirdropSignature = await provider.connection.requestAirdrop(
      creator.publicKey,
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
    comptoirMint = await splToken.createMint(
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
    sellerNftTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      seller,
      nftMint,
      seller.publicKey
    )).address
    // const ata = await splToken.getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   buyer,
    //   comptoirMint,
    //   buyer.publicKey,
    // )
    // await splToken.mintTo(provider.connection, buyer, comptoirMint, ata.address, admin, price)
  });

  it('create comptoir', async () => {
    comptoir = new Comptoir(provider, getComptoirPDA(admin.publicKey))
    await comptoir.createComptoir(admin, comptoirMint, fee, adminTokenAccount)
    const createdComptoir = await comptoir.program.account.comptoir.fetch(comptoir.comptoirPDA)
    assert.equal(createdComptoir.fees.toString(), fee.toString());
    assert.equal(createdComptoir.mint.toString(), comptoirMint.toString());
    assert.equal(createdComptoir.authority.toString(), admin.publicKey.toString());
    assert.equal(createdComptoir.feesDestination.toString(), adminTokenAccount.toString());
  });

  it('fail: create comptoir fee > 10000', async () => {
    let tmpAuthority = anchor.web3.Keypair.generate()
    let fromAirdropSignature = await provider.connection.requestAirdrop(
      tmpAuthority.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    )
    await confirmTx(provider.connection, fromAirdropSignature);

    const tmpTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      tmpAuthority,
      comptoirMint,
      tmpAuthority.publicKey,
    );

    await assert.rejects(
      comptoir.createComptoir(tmpAuthority, comptoirMint, feeAbove1000, tmpTokenAccount.address)
    )
  });

  it('update comptoir fields', async () => {
    const tmpFee = 5;
    const tmpAuthority = anchor.web3.Keypair.generate()
    const fromAirdropSignature = await provider.connection.requestAirdrop(
      tmpAuthority.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    )
    await confirmTx(provider.connection, fromAirdropSignature);

    const newComptoirMint = await splToken.createMint(
      provider.connection,
      tmpAuthority,
      tmpAuthority.publicKey,
      null,
      7,
    );
    await comptoir.program.methods
      .updateComptoir(tmpFee, newComptoirMint, tmpAuthority.publicKey)
      .accounts({
        authority: admin.publicKey,
        comptoir: comptoir.comptoirPDA,
      })
      .signers([admin])
      .rpc()

    let updatedComptoir = await comptoir.program.account.comptoir.fetch(comptoir.comptoirPDA)
    assert.equal(updatedComptoir.fees.toString(), tmpFee.toString());
    assert.equal(updatedComptoir.authority.toString(), tmpAuthority.publicKey.toString());
    assert.equal(updatedComptoir.feesDestination.toString(), newComptoirMint.toString());

    // revert role
    await comptoir.program.methods
      .updateComptoir(fee, comptoirMint, admin.publicKey)
      .accounts({
        authority: tmpAuthority.publicKey,
        comptoir: comptoir.comptoirPDA,
      })
      .signers([tmpAuthority])
      .rpc()
      .catch(console.log);
  });

  it('create collection', async () => {
    // await comptoir.createCollection(
    //   creator,
    //   collectionName,
    //   creator.publicKey,
    //   collectionSymbol,
    //   false,
    //   collectionFee
    // )
    // const collectionPDA = getCollectionPDA(comptoir.comptoirPDA, collectionName)
    // const createdCollection = await comptoir.program.account.collection.fetch(collectionPDA)
    // assert.equal(createdCollection.comptoirKey.toString(), comptoir.comptoirPDA.toString());
    // assert.equal(createdCollection.requiredVerifier.toString(), creator.publicKey.toString());
    // assert.equal(createdCollection.symbol.toString(), collectionName);
    // assert.equal(createdCollection.fees.toString(), collectionFee.toString());
  });

  it('fail: create collection fee > 10000', async () => {
    await assert.rejects(
      comptoir.createCollection(
        creator,
        collectionName + "fail",
        creator.publicKey,
        collectionSymbol + "FAIL",
        false,
        feeAbove1000
      )
    );
  });

  // it('update collection', async () => {
  //   let tmpFee = 12
  //   let tmpName = "some name"
  //   let tmpRequiredVerifier = anchor.web3.Keypair.generate().publicKey

  //   await program.methods.updateCollection(tmpFee, tmpName, tmpRequiredVerifier, false).accounts({
  //     authority: admin.publicKey,
  //     comptoir: comptoirPDA,
  //     collection: collectionPDA,
  //   }).signers([admin]).rpc()

  //   let updatedCollection = await program.account.collection.fetch(collectionPDA)
  //   assert.equal(updatedCollection.requiredVerifier.toString(), tmpRequiredVerifier.toString());
  //   assert.equal(updatedCollection.symbol.toString(), tmpName);
  //   assert.equal(updatedCollection.fees.toString(), tmpFee.toString());
  //   assert.equal(updatedCollection.ignoreCreatorFee, false);

  //   // reset
  //   await program.methods.updateCollection(collectionFee, collectionName, creator.publicKey, false).accounts({
  //     authority: admin.publicKey,
  //     comptoir: comptoirPDA,
  //     collection: collectionPDA,
  //   },
  //   ).signers([admin]).rpc()
  // });
});
