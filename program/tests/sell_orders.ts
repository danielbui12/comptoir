import "mocha";
import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { 
  createMint as createMintToken,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccount,
  Account,
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
	let sellerAssociatedTokenAccount: web3.PublicKey;
	let seller: web3.Keypair;
  let sellerTokenAccount: web3.PublicKey;
  let comptoirMint: web3.PublicKey;
  let nftMint: web3.PublicKey;
  let sellPrice: anchor.BN = new anchor.BN(1000);
  let sellQuantity: anchor.BN = new anchor.BN(1);

	let comptoir: Comptoir;
	let collection: Collection;


	it('Prepare tests variables', async () => {
		creator = anchor.web3.Keypair.generate()
		let fromAirdropSignature = await provider.connection.requestAirdrop(
			creator.publicKey,
			anchor.web3.LAMPORTS_PER_SOL,
		);
    await confirmTx(provider.connection, fromAirdropSignature);

		seller = anchor.web3.Keypair.generate()
		fromAirdropSignature = await provider.connection.requestAirdrop(
			seller.publicKey,
			anchor.web3.LAMPORTS_PER_SOL,
		);
    await confirmTx(provider.connection, fromAirdropSignature);

    comptoirMint = await createMintToken(
      provider.connection,
      seller,
      seller.publicKey,
      null,
      6
    );

    const metadata = nft_data(creator.publicKey);
    const { mint } = await mintNFT(
      provider.connection,
      creator,
      metadata,
    );
    nftMint = mint

    sellerTokenAccount = getAssociatedTokenAddress(seller.publicKey, comptoirMint);
    console.log('sellerTokenAccount', sellerTokenAccount.toString());
    sellerAssociatedTokenAccount = getAssociatedTokenAddress(seller.publicKey, nftMint);
    console.log('sellerAssociatedTokenAccount', sellerAssociatedTokenAccount.toString());
   
    const comptoirPDA = getComptoirPDA(creator.publicKey)
    comptoir = new Comptoir(provider, comptoirPDA);
  
    console.log('Creating comptoir...')
		await comptoir.createComptoir(seller, comptoirMint, 5, sellerTokenAccount)
    console.log('Created comptoir')
	
    console.log('Creating collection...')
    await comptoir.createCollection(seller, "aurorian", creator.publicKey, "AURY", false, 2)
    console.log('Created collection')

    const collectionPDA = getCollectionPDA(comptoir.comptoirPDA, "aurorian")
    collection = new Collection(provider, collectionPDA, comptoir)
	});

	it('sell and buy multiple orders', async function () {
    console.log('Selling asset...')
		await collection.sellAsset(
			nftMint,
      sellerAssociatedTokenAccount,
      sellerTokenAccount,
			sellPrice,
			sellQuantity,
			seller,
		)
    console.log('Created asset')

    // let sellerAfterSell = await getAccount(provider.connection, sellerNftAssociatedTokenAccount);
    // assert.equal(Number(sellerAfterSell.amount), 1)

		// let nftVaultAddr = getNftVaultPDA(nftMint)
		// let vaultAfterSell = await getAccount(provider.connection, nftVaultAddr)

		// assert.equal(Number(vaultAfterSell.amount), 4)

		// let buyer = anchor.web3.Keypair.generate()
		// let fromAirdropSignature = await provider.connection.requestAirdrop(
		// 	buyer.publicKey,
		// 	anchor.web3.LAMPORTS_PER_SOL,
		// );
    // await confirmTx(provider.connection, fromAirdropSignature)

    // let buyerTokenATA = await createAssociatedTokenAccount(provider.connection, buyer, comptoirMint, buyer.publicKey)
    // await mintTo(provider.connection, buyer, comptoirMint, buyerTokenATA, seller, 8400)

    // let buyerNftATA = await createAssociatedTokenAccount(provider.connection, buyer, nftMint, buyer.publicKey)

		// await collection.buy(
		// 	nftMint,
		// 	[
		// 		getSellOrderPDA(sellerNftAssociatedTokenAccount, new anchor.BN(2000)),
		// 		getSellOrderPDA(sellerNftAssociatedTokenAccount, new anchor.BN(2200)),
		// 	],
		// 	buyerNftATA,
		// 	buyerTokenATA,
		// 	new anchor.BN(4),
		// 	buyer,
		// )

		// let buyerNftAccountAfterSell = await getAccount(provider.connection, buyerNftATA)
		// assert.equal(Number(buyerNftAccountAfterSell.amount), 4)

		// let buyerTokenAccountAfterSell = await getAccount(provider.connection, buyerTokenATA)
		// assert.equal(Number(buyerTokenAccountAfterSell.amount), 0)

		// let creatorTokenAccountAfterSell = await getAccount(provider.connection, creatorTokenAccount.address)
		// assert.equal(Number(creatorTokenAccountAfterSell.amount), 840)
	});
});
