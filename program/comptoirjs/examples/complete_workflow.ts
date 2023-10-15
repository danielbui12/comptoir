import * as anchor from '@project-serum/anchor'
import { Comptoir } from '../comptoir'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getCollectionPDA, getComptoirPDA, getSellOrderPDA } from '../getPDAs'
import * as splToken from '@solana/spl-token'
import { Collection } from '../collection'
import { mintNFT, loadKeypairFromFile, nft_data } from './utils/helper'
import { WrapperConnection } from './utils/WrapperConnection'

const connection = new WrapperConnection("https://api.devnet.solana.com", 'finalized');
const payer = loadKeypairFromFile("/home/daniel/.config/solana/id.json")
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), {})

async function workflow(comptoirMint: PublicKey, nftMint: PublicKey) {
  let comptoirPDA = getComptoirPDA(
    payer.publicKey
  )
  let comptoir = new Comptoir(
    provider,
    comptoirPDA
  )
  
  console.log('Creating comptoir...')
  await comptoir.createComptoir(
    payer,
    comptoirMint,
    5,
    getAssociatedTokenAddress(
      payer.publicKey,
      comptoirMint,
    )
  )
  console.log('Created comptoir')

  console.log('Creating collection...')
  await comptoir.createCollection(
    payer,
    'aurorian',
    payer.publicKey,
    'AURY',
    true,
    2,
  )
  console.log('Created collection')

  let collectionPDA = getCollectionPDA(comptoir.comptoirPDA as PublicKey, 'aurorian')
  let userNftAccount = getAssociatedTokenAddress(payer.publicKey, nftMint)
  let userTokenAccount = getAssociatedTokenAddress(payer.publicKey, comptoirMint)
  let collection = new Collection(provider, collectionPDA, comptoir)

  let sellPrice = new anchor.BN(1000)
  let sellQuantity = new anchor.BN(1)
  console.log('Selling asset...')
  await collection.sellAsset(
    nftMint,
    userNftAccount,
    userTokenAccount,
    sellPrice,
    sellQuantity,
    payer
  )
  console.log('Created asset')

  const sellOrderPDA = getSellOrderPDA(userNftAccount, sellPrice)
  console.log('Buying asset...')
  //We buy our own asset just for demonstration
  await collection.buy(
    nftMint,
    [sellOrderPDA],
    userNftAccount,
    userTokenAccount,
    sellQuantity,
    payer
  )
  console.log('Bought')
}

async function mintMeNft(): Promise<PublicKey> {
  const metadata = nft_data(payer.publicKey);
  
  const { mint, tokenAccount, metadataAccount, masterEditionAccount } = await mintNFT(
    connection,
    payer,
    metadata,
  );  
  return mint
}

async function mintMeFt(): Promise<PublicKey> {
  const comptoirMint = await splToken.createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6
  );

  const ata = await splToken.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    comptoirMint,
    payer.publicKey,
  )

  await splToken.mintTo(connection, payer, comptoirMint, ata.address, payer, 1000)
  return comptoirMint;
}

const confirmTx = async (connection: typeof provider.connection, txHash: string) => {
  const blockhashInfo = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: blockhashInfo.blockhash,
    lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
    signature: txHash,
  });
};

async function setup() {
  let fromAirdropSignature = await provider.connection.requestAirdrop(
    payer.publicKey,
    5 * anchor.web3.LAMPORTS_PER_SOL,
  )
  await confirmTx(provider.connection, fromAirdropSignature);

  const nftMint = await mintMeNft()
  const comptoirMint = await mintMeFt();
 
  return [comptoirMint, nftMint]
}

(async () => {
  const [comptoirMint, nftMint] = await setup()
  await workflow(
    comptoirMint,
    nftMint,
  )
})()
