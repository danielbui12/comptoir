import "mocha";
import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
import assert from "assert";
import { confirmTx, nft_data } from "../utils/helper";
import { Collection, Comptoir, getCollectionPDA, getComptoirPDA } from "../comptoirjs";

let provider = anchor.getProvider()
anchor.setProvider(provider);

describe('comptoir with mint', () => {
  let admin: web3.Keypair;
  let adminTokenAccount: web3.PublicKey;
  let creator: web3.Keypair;
  let seller: web3.Keypair;
  let collectionPDA: web3.PublicKey;
  let comptoirMint: web3.PublicKey;
  let comptoir: Comptoir;
  let collectionFee = 500;

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
    adminTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      comptoirMint,
      admin.publicKey,
    )).address;
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
    await comptoir
      .updateComptoir(tmpFee, newComptoirMint, tmpAuthority.publicKey, admin)
      .catch(console.log);

    let updatedComptoir = await comptoir.getComptoir();
    assert.equal(updatedComptoir.fees.toString(), tmpFee.toString());
    assert.equal(updatedComptoir.authority.toString(), tmpAuthority.publicKey.toString());
    assert.equal(updatedComptoir.feesDestination.toString(), newComptoirMint.toString());

    // revert role
    await comptoir.updateComptoir(fee, comptoirMint, admin.publicKey, tmpAuthority)
      .catch(console.log);
  });

  it('update comptoir mint', async () => {
    const newComptoirMint = await splToken.createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6,
    );
    const newAdminTokenAccount = (await splToken.getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      newComptoirMint,
      admin.publicKey,
    )).address;

    await comptoir.updateComptoirMint(
      newComptoirMint,
      newAdminTokenAccount,
      comptoirMint,
      admin
    )
      .catch(console.log)

      
    const updatedComptoir = await comptoir.getComptoir(true);
    assert.equal(updatedComptoir.feesDestination.toString(), newAdminTokenAccount.toString());
    assert.equal(updatedComptoir.mint.toString(), newComptoirMint.toString());
  });

  it('create collection', async () => {
    await comptoir.createCollection(
      admin,
      collectionName,
      creator.publicKey,
      collectionSymbol,
      false,
      collectionFee
    )
    collectionPDA = getCollectionPDA(comptoir.comptoirPDA, collectionName)
    const createdCollection = await comptoir.program.account.collection.fetch(collectionPDA)
    assert.equal(createdCollection.comptoirKey.toString(), comptoir.comptoirPDA.toString());
    assert.equal(createdCollection.requiredVerifier.toString(), creator.publicKey.toString());
    assert.equal(createdCollection.symbol.toString(), collectionSymbol);
    assert.equal(createdCollection.name.toString(), collectionName);
    assert.equal(createdCollection.fees.toString(), collectionFee.toString());
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

  it('update collection', async () => {
    const tmpFee = 12
    const tmpName = "some name"
    const tmpRequiredVerifier = anchor.web3.Keypair.generate().publicKey
    const collection = new Collection(provider, collectionPDA, comptoir)

    await collection.updateCollection(tmpFee, tmpName, tmpRequiredVerifier, false, admin.publicKey, admin)

    const updatedCollection = await collection.getCollection();
    assert.equal(updatedCollection.requiredVerifier.toString(), tmpRequiredVerifier.toString());
    assert.equal(updatedCollection.symbol.toString(), tmpName);
    assert.equal(updatedCollection.fees.toString(), tmpFee.toString());
    assert.equal(updatedCollection.ignoreCreatorFee, false);

    // reset
    await collection.updateCollection(collectionFee, collectionName, creator.publicKey, false, admin.publicKey, admin)
  });
});
