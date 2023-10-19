import "mocha";
import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { 
  createMint as createMintToken,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import assert from "assert";
import { nft_data } from "../utils/helper";
import { mintNFT } from "../utils/utils";
import { Comptoir, Collection, getSellOrderPDA, getCollectionPDA, getNftVaultPDA, getComptoirPDA, getAssociatedTokenAddress } from "../comptoirjs";
import { confirmTx } from "../utils/helper";

const provider = anchor.getProvider()
anchor.setProvider(provider);

describe('multi sell orders test', () => {
	let creator: web3.Keypair;
	let seller: web3.Keypair;
  let sellerNftAccount: web3.PublicKey;
  let sellerTokenAccount: web3.PublicKey;
  let comptoirMint: web3.PublicKey;
  let nftMint: web3.PublicKey;
  let sellPrice: anchor.BN = new anchor.BN(1000);
  let sellQuantity: anchor.BN = new anchor.BN(1);

	let comptoir: Comptoir;
	let collection: Collection;


	it('Prepare tests variables', async () => {
    /////////////// INIT CREATOR ///////////////////
		creator = anchor.web3.Keypair.generate()
		let fromAirdropSignature = await provider.connection.requestAirdrop(
			creator.publicKey,
			anchor.web3.LAMPORTS_PER_SOL,
		);
    await confirmTx(provider.connection, fromAirdropSignature);    

    /////////////// INIT SELLER //////////////////
		seller = anchor.web3.Keypair.generate()
		fromAirdropSignature = await provider.connection.requestAirdrop(
			seller.publicKey,
			anchor.web3.LAMPORTS_PER_SOL,
		);
    await confirmTx(provider.connection, fromAirdropSignature);

    /////////////// INIT TOKEN //////////////////
    comptoirMint = await createMintToken(
      provider.connection,
      creator,
      creator.publicKey,
      null,
      6
    );
    const ata = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      seller,
      comptoirMint,
      seller.publicKey,
    )
    await mintTo(provider.connection, seller, comptoirMint, ata.address, creator, 1000)

    ///////////////// INIT NFT ////////////////
    const metadata = nft_data(seller.publicKey);
    const { mint } = await mintNFT(
      provider.connection,
      seller,
      metadata,
    );
    nftMint = mint

    /////////////// INIT PDA //////////////////
    sellerTokenAccount = getAssociatedTokenAddress(seller.publicKey, comptoirMint);
    console.log('sellerTokenAccount', sellerTokenAccount.toString());
    sellerNftAccount = getAssociatedTokenAddress(seller.publicKey, nftMint);
    console.log('sellerNftAccount', sellerNftAccount.toString());

    ///////////// INIT COLLECTION /////////////
    comptoir = new Comptoir(provider, getComptoirPDA(creator.publicKey));  
    console.log('Creating comptoir...')
		await comptoir.createComptoir(seller, comptoirMint, 5, sellerTokenAccount)
    console.log('Created comptoir')
	
    console.log('Creating collection...')
    await comptoir.createCollection(seller, "aurorian", seller.publicKey, "AURY", false, 2)
    console.log('Created collection')

    const collectionPDA = getCollectionPDA(comptoir.comptoirPDA, "aurorian")
    collection = new Collection(provider, collectionPDA, comptoir)
  });

  it('sell and buy multiple orders', async function () {
    /////////////// SELL ASSET //////////////////
    console.log('Selling asset...')
    await collection.sellAsset(
      nftMint,
      sellerNftAccount,
      sellerTokenAccount,
      sellPrice,
      sellQuantity,
      seller,
    )
    console.log('Created asset')

    const sellerAfterSell = await getAccount(provider.connection, sellerNftAccount);
    assert.equal(Number(sellerAfterSell.amount), 0)

    const vaultAfterSell = await getAccount(provider.connection, getNftVaultPDA(nftMint))
		assert.equal(Number(vaultAfterSell.amount), 1)
    
    /////////////// INIT BUYER //////////////////
		const buyer = anchor.web3.Keypair.generate()
		const fromAirdropSignature = await provider.connection.requestAirdrop(
			buyer.publicKey,
			anchor.web3.LAMPORTS_PER_SOL,
		);
    await confirmTx(provider.connection, fromAirdropSignature)

    const buyerTokenATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      comptoirMint,
      buyer.publicKey
    )
    await mintTo(provider.connection, buyer, comptoirMint, buyerTokenATA.address, creator, 8400)

    const buyerNftATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      nftMint,
      buyer.publicKey
    );
    const sellOrderPDA = getSellOrderPDA(sellerNftAccount, sellPrice);
    
    /////////////// BUY ASSET //////////////////
    console.log('Buying asset...')
		await collection.buy(
			nftMint,
			[sellOrderPDA],
			buyerNftATA.address,
			buyerTokenATA.address,
      sellQuantity,
			buyer,
		).catch(console.log)
    console.log('Bought asset')

		const buyerNftAccountAfterSell = await getAccount(provider.connection, buyerNftATA.address)
		assert.equal(Number(buyerNftAccountAfterSell.amount), 1)

		const buyerTokenAccountAfterSell = await getAccount(provider.connection, buyerTokenATA.address)
    assert.equal(Number(buyerTokenAccountAfterSell.amount), 7400)
  });
});
