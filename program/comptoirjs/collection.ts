import * as anchor from '@project-serum/anchor';
import { Comptoir as ComptoirDefinition } from './types/comptoir';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  getAssociatedTokenAddress,
  getBuyOfferPDA,
  getEscrowPDA,
  getMetadataPDA,
  getNftVaultPDA,
  getSellOrderPDA,
} from './getPDAs';
import { getMetadata } from './metaplex';
import idl from './types/comptoir.json';
import { IdlAccounts, web3 } from '@project-serum/anchor';
import { Comptoir } from './comptoir';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

export class Collection {
  program: anchor.Program<ComptoirDefinition>;
  collectionPDA: PublicKey;
  comptoir: Comptoir;
  provider: anchor.Provider;
  cacheTime = 60 * 1000 // 60 seconds
  checkPoint = new Date().getTime()

  private collectionCache?: IdlAccounts<ComptoirDefinition>['collection'];

  constructor(
    provider: anchor.Provider,
    collectionPDA: PublicKey,
    comptoir: Comptoir,
  ) {
    this.comptoir = comptoir;
    this.program = new anchor.Program(
      // @ts-ignore
      idl as ComptoirDefinition,
      comptoir.programID,
      provider
    );
    this.provider = provider;
    this.collectionPDA = collectionPDA;
  }

  async sellAssetInstruction(
    nftMint: PublicKey,
    sellerNftAccount: PublicKey,
    sellerDestination: PublicKey,
    price: anchor.BN,
    amount: anchor.BN,
    seller: PublicKey
  ): Promise<TransactionInstruction> {
    if (!this.comptoir.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }

    const programNftVaultPDA = getNftVaultPDA(nftMint, this.comptoir.programID);
    const sellOrderPDA = getSellOrderPDA(sellerNftAccount, price, this.comptoir.programID);
    const metadataPDA = getMetadataPDA(nftMint);

    return await this.program.methods
      .createSellOrder(price, amount, sellerDestination)
      .accounts({
        payer: seller,
        sellerNftTokenAccount: sellerNftAccount,
        comptoir: this.comptoir.comptoirPDA,
        collection: this.collectionPDA,
        mint: nftMint,
        metadata: metadataPDA,
        vault: programNftVaultPDA,
        sellOrder: sellOrderPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async sellAsset(
    nftMint: PublicKey,
    sellerNftAccount: PublicKey,
    sellerDestination: PublicKey,
    price: anchor.BN,
    amount: anchor.BN,
    seller: Keypair
  ): Promise<string> {
    let ix = await this.sellAssetInstruction(
      nftMint,
      sellerNftAccount,
      sellerDestination,
      price,
      amount,
      seller.publicKey
    );
    return this._sendInstruction(ix, [seller]);
  }

  async removeSellOrderInstruction(
    nftMint: PublicKey,
    sellerNftAccount: PublicKey,
    sellOrderPDA: PublicKey,
    amount: anchor.BN,
    seller: PublicKey
  ): Promise<TransactionInstruction> {
    let programNftVaultPDA = getNftVaultPDA(nftMint, this.comptoir.programID);
    return await this.program.methods
      .removeSellOrder(amount)
      .accounts({
        authority: seller,
        sellerNftTokenAccount: sellerNftAccount,
        vault: programNftVaultPDA,
        sellOrder: sellOrderPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async removeSellOrder(
    nftMint: PublicKey,
    sellerNftAccount: PublicKey,
    sellOrderPDA: PublicKey,
    amount: anchor.BN,
    seller: Keypair
  ): Promise<string> {
    let ix = await this.removeSellOrderInstruction(
      nftMint,
      sellerNftAccount,
      sellOrderPDA,
      amount,
      seller.publicKey
    );
    return this._sendInstruction(ix, [seller]);
  }

  async addToSellOrderInstruction(
    nftMint: PublicKey,
    sellerNftAccount: PublicKey,
    sellOrderPDA: PublicKey,
    amount: anchor.BN,
    seller: PublicKey
  ): Promise<TransactionInstruction> {
    let programNftVaultPDA = await getNftVaultPDA(nftMint, this.comptoir.programID);
    return await this.program.methods
      .addQuantityToSellOrder(amount)
      .accounts({
        authority: seller,
        sellerNftTokenAccount: sellerNftAccount,
        vault: programNftVaultPDA,
        sellOrder: sellOrderPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async addToSellOrder(
    nftMint: PublicKey,
    sellerNftAccount: PublicKey,
    sellOrderPDA: PublicKey,
    amount: anchor.BN,
    seller: Keypair
  ): Promise<string> {
    let ix = await this.addToSellOrderInstruction(
      nftMint,
      sellerNftAccount,
      sellOrderPDA,
      amount,
      seller.publicKey
    );
    return this._sendInstruction(ix, [seller]);
  }

  async buyInstruction(
    nftMint: PublicKey,
    sellOrdersPDA: PublicKey[],
    buyerNftAccount: PublicKey,
    buyerPayingAccount: PublicKey,
    wanted_quantity: anchor.BN,
    buyer: PublicKey
  ): Promise<TransactionInstruction> {
    if (!this.comptoir.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }
    const comptoirAccount = await this.program.account.comptoir.fetch(
      this.comptoir.comptoirPDA
    );
    const programNftVaultPDA = getNftVaultPDA(nftMint, this.program.programId);
    const metadataPDA = getMetadataPDA(nftMint);

    const metadata = await getMetadata(this.program.provider.connection, metadataPDA);
      
    const collection = await this.getCollection();
    let creatorsAccounts: {
      pubkey: anchor.web3.PublicKey;
      isWritable: boolean;
      isSigner: boolean;
    }[] = [];
    if (!collection.ignoreCreatorFee) {
      creatorsAccounts = await this._extractCreatorsAsRemainingAccount(
        metadata
      );
    }

    const sellOrders = [];
    for (let sellOrderPDA of sellOrdersPDA) {
      let so = await this.program.account.sellOrder.fetch(sellOrderPDA);
      sellOrders.push({
        pubkey: sellOrderPDA,
        isWritable: true,
        isSigner: false,
      });
      sellOrders.push({
        pubkey: so.destination,
        isWritable: true,
        isSigner: false,
      });
    }
    
    return await this.program.methods
      .buy(wanted_quantity)
      .accounts({
        buyer: buyer,
        buyerNftTokenAccount: buyerNftAccount,
        buyerPayingTokenAccount: buyerPayingAccount,
        comptoir: this.comptoir.comptoirPDA,
        comptoirDestAccount: comptoirAccount.feesDestination,
        collection: this.collectionPDA,
        metadata: metadataPDA,
        vault: programNftVaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([...creatorsAccounts, ...sellOrders])
      .instruction();
  }

  async buy(
    nftMint: PublicKey,
    sellOrdersPDA: PublicKey[],
    buyerNftAccount: PublicKey,
    buyerPayingAccount: PublicKey,
    wanted_quantity: anchor.BN,
    buyer: Keypair
  ): Promise<string> {
    let ix = await this.buyInstruction(
      nftMint,
      sellOrdersPDA,
      buyerNftAccount,
      buyerPayingAccount,
      wanted_quantity,
      buyer.publicKey
    );
    return this._sendInstruction(ix, [buyer]);
  }

  async createBuyOfferInstruction(
    nftMintToBuy: PublicKey,
    offerPrice: anchor.BN,
    buyerNftAccount: PublicKey,
    buyerPayingAccount: PublicKey,
    buyer: PublicKey
  ): Promise<TransactionInstruction> {
    if (!this.comptoir.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }

    const escrowPDA = getEscrowPDA(
      this.comptoir.comptoirPDA,
      (
        await this.comptoir.getComptoir()
      ).mint,
      this.comptoir.programID
    );

    const buyOfferPDA = getBuyOfferPDA(
      this.comptoir.comptoirPDA,
      buyer,
      nftMintToBuy,
      offerPrice,
      this.comptoir.programID
    );

    const metadataPDA = getMetadataPDA(nftMintToBuy);

    return await this.program.methods
      .createBuyOffer(offerPrice)
      .accounts({
        payer: buyer,
        nftMint: nftMintToBuy,
        metadata: metadataPDA,
        comptoir: this.comptoir.comptoirPDA,
        collection: this.collectionPDA,
        escrow: escrowPDA,
        buyerNftAccount: buyerNftAccount,
        buyerPayingAccount: buyerPayingAccount,
        buyOffer: buyOfferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async createBuyOffer(
    nftMintToBuy: PublicKey,
    offerPrice: anchor.BN,
    buyerNftAccount: PublicKey,
    buyerPayingAccount: PublicKey,
    buyer: Keypair
  ): Promise<string> {
    let ix = await this.createBuyOfferInstruction(
      nftMintToBuy,
      offerPrice,
      buyerNftAccount,
      buyerPayingAccount,
      buyer.publicKey
    );
    return this._sendInstruction(ix, [buyer]);
  }

  async removeBuyOfferInstruction(
    buyOfferPDA: PublicKey,
    buyerTokenAccount: PublicKey,
    buyer: PublicKey
  ): Promise<TransactionInstruction> {
    if (!this.comptoir.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }
    const escrowPDA = getEscrowPDA(
      this.comptoir.comptoirPDA,
      (
        await this.comptoir.getComptoir()
      ).mint,
      this.comptoir.programID
    );

    return await this.program.methods
      .removeBuyOffer()
      .accounts({
        buyer: buyer,
        buyerPayingAccount: buyerTokenAccount,
        comptoir: this.comptoir.comptoirPDA,
        escrow: escrowPDA,
        buyOffer: buyOfferPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async removeBuyOffer(
    buyOfferPDA: PublicKey,
    buyerTokenAccount: PublicKey,
    buyer: Keypair
  ): Promise<string> {
    let ix = await this.removeBuyOfferInstruction(
      buyOfferPDA,
      buyerTokenAccount,
      buyer.publicKey
    );
    return this._sendInstruction(ix, [buyer]);
  }

  async executeOfferInstruction(
    nftMint: PublicKey,
    buyOfferPDA: PublicKey,
    buyer: PublicKey,
    buyerNftTokenAccount: PublicKey,
    sellerTokenAccount: PublicKey,
    sellerNftTokenAccount: PublicKey,
    seller: PublicKey
  ): Promise<TransactionInstruction> {
    const metadata = await getMetadata(this.program.provider.connection, nftMint);

    if (!this.comptoir.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }

    const escrowPDA = getEscrowPDA(
      this.comptoir.comptoirPDA,
      (
        await this.comptoir.getComptoir()
      ).mint,
      this.comptoir.programID
    );

    let creatorsAccounts: {
      pubkey: anchor.web3.PublicKey;
      isWritable: boolean;
      isSigner: boolean;
    }[] = [];
    if (!(await this.getCollection()).ignoreCreatorFee) {
      creatorsAccounts = await this._extractCreatorsAsRemainingAccount(
        metadata
      );
    }

    return await this.program.methods
      .executeOffer()
      .accounts({
        seller: seller,
        buyer: buyer,
        comptoir: this.comptoir.comptoirPDA,
        collection: this.collectionPDA,
        comptoirDestAccount: (
          await this.comptoir.getComptoir()
        ).feesDestination,
        escrow: escrowPDA,
        sellerFundsDestAccount: sellerTokenAccount,
        destination: buyerNftTokenAccount,
        sellerNftAccount: sellerNftTokenAccount,
        buyOffer: buyOfferPDA,
        metadata: getMetadataPDA(nftMint),
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts([...creatorsAccounts])
      .instruction();
  }

  async executeOffer(
    nftMint: PublicKey,
    buyOfferPDA: PublicKey,
    buyer: PublicKey,
    buyerNftTokenAccount: PublicKey,
    sellerTokenAccount: PublicKey,
    sellerNftTokenAccount: PublicKey,
    seller: Keypair
  ) {
    let ix = await this.executeOfferInstruction(
      nftMint,
      buyOfferPDA,
      buyer,
      buyerNftTokenAccount,
      sellerTokenAccount,
      sellerNftTokenAccount,
      seller.publicKey
    );
    return this._sendInstruction(ix, [seller]);
  }

  async getCollection(refreshCache = false): Promise<
    IdlAccounts<ComptoirDefinition>['collection']
  > {
    if (refreshCache) {
      this.checkPoint = new Date().getTime();
    }
    if (new Date().getTime() - this.checkPoint >= this.cacheTime && this.collectionCache) {
      return this.collectionCache;
    }
    this.collectionCache = await this.program.account.collection.fetch(
      this.collectionPDA
    );
    this.checkPoint = new Date().getTime();
    return this.collectionCache;
  }

  _sendInstruction(
    ix: TransactionInstruction,
    signers: Keypair[]
  ): Promise<string> {
    const tx = new web3.Transaction();
    tx.add(ix);
    // @ts-ignore
    return this.program.provider.sendAll([{tx, signers}]);
  }

  async _extractCreatorsAsRemainingAccount(metadata: Metadata) {
    const creatorsAccounts = [];
    if (metadata.data?.creators) {
      for (let creator of metadata.data.creators) {
        let creatorAddress = new PublicKey(creator.address);
        let comptoirMint = (await this.comptoir.getComptoir()).mint;

        let creatorATA = getAssociatedTokenAddress(
          creatorAddress,
          comptoirMint
        );
        creatorsAccounts.push({
          pubkey: creatorATA,
          isWritable: true,
          isSigner: false,
        });
      }
    }
    return creatorsAccounts;
  }

  async updateCollectionInstruction(
    collectionFee: number,
    collectionName: string,
    requiredVerifier: PublicKey,
    ignoreCreatorFee: boolean,
    adminPubKey: PublicKey,
  ): Promise<TransactionInstruction> {
    if (!this.comptoir.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }

    return await this.program.methods
      .updateCollection(collectionFee, collectionName, requiredVerifier, ignoreCreatorFee)
      .accounts({
        authority: adminPubKey,
        comptoir: this.comptoir.comptoirPDA,
        collection: this.collectionPDA,
      })
      .instruction()
  }

  async updateCollection(
    collectionFee: number, 
    collectionName: string,
    requiredVerifier: PublicKey,
    ignoreCreatorFee: boolean,
    adminPubKey: PublicKey,
    owner: Keypair
  ): Promise<string> {
    let ix = await this.updateCollectionInstruction(
      collectionFee,
      collectionName,
      requiredVerifier,
      ignoreCreatorFee,
      adminPubKey,
    );
    return this._sendInstruction(ix, [owner]);
  }
}
