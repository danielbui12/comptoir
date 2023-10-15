import { PublicKey } from '@metaplex-foundation/js';
import { CreateMetadataAccountArgsV3, createCreateMasterEditionV3Instruction, createCreateMetadataAccountV3Instruction, createSetCollectionSizeInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { TOKEN_PROGRAM_ID, createAccount, createMint, mintTo } from '@solana/spl-token';
import { Connection, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs'
import { getMasterEditionPDA, getMetadataPDA } from '../../getPDAs';

/*
  Load a locally stored JSON keypair file and convert it to a valid Keypair
*/
export function loadKeypairFromFile(absPath: string) {
  try {
    if (!absPath) throw Error("No path provided");
    if (!fs.existsSync(absPath)) throw Error("File does not exist.");

    // load the keypair from the file
    const keyfileBytes = JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" }));
    // parse the loaded secretKey into a valid keypair
    const keypair = Keypair.fromSecretKey(new Uint8Array(keyfileBytes));
    return keypair;
  } catch (err) {
    // return false;
    throw err;
  }
}

export const nft_data = (creator: PublicKey): CreateMetadataAccountArgsV3 => ({
  data: {
    name: 'Helios 3D',
    symbol: 'AURY',
    uri: 'https://arweave.net/uKoxW5gu2A7Wem-tgyWZ9-T46aAg49Gac-n0GNibTjI',
    sellerFeeBasisPoints: 100,
    creators: [
      {
        address: creator,
        verified: true,
        share: 100,
      },
    ],
    collection: null,
    uses: null,
  },
  isMutable: false,
  collectionDetails: null,
});

/**
 * Create an NFT collection on-chain, using the regular Metaplex standards
 * with the `payer` as the authority
 */
export async function mintNFT(
  connection: Connection,
  payer: Keypair,
  metadataV3: CreateMetadataAccountArgsV3,
) {
  // create and initialize the SPL token mint
  console.log("Creating the collection's mint...");
  const mint = await createMint(
    connection,
    payer,
    // mint authority
    payer.publicKey,
    // freeze authority
    payer.publicKey,
    // decimals - use `0` for NFTs since they are non-fungible
    0,
  );
  console.log("Mint address:", mint.toBase58());

  // create the token account
  console.log("Creating a token account...");
  const tokenAccount = await createAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  console.log("Token account:", tokenAccount.toBase58());

  // mint 1 token ()
  console.log("Minting 1 token for the collection...");
  const mintSig = await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer,
    // mint exactly 1 token
    1,
    // no `multiSigners`
    [],
    undefined,
    TOKEN_PROGRAM_ID,
  );
  console.log('min Token transaction signature', mintSig);
  
  // derive the PDA for the metadata account
  const metadataAccount = getMetadataPDA(mint);
  console.log("Metadata account:", metadataAccount.toBase58());

  // create an instruction to create the metadata account
  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: metadataV3,
    },
  );

  // derive the PDA for the metadata account
  const masterEditionAccount = getMasterEditionPDA(mint);
  console.log("Master edition account:", masterEditionAccount.toBase58());

  // create an instruction to create the metadata account
  const createMasterEditionIx = createCreateMasterEditionV3Instruction(
    {
      edition: masterEditionAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
      metadata: metadataAccount,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0,
      },
    },
  );

  // create the collection size instruction
  const collectionSizeIX = createSetCollectionSizeInstruction(
    {
      collectionMetadata: metadataAccount,
      collectionAuthority: payer.publicKey,
      collectionMint: mint,
    },
    {
      setCollectionSizeArgs: { size: 50 },
    },
  );

  try {
    // construct the transaction with our instructions, making the `payer` the `feePayer`
    const tx = new Transaction()
      .add(createMetadataIx)
      .add(createMasterEditionIx)
      .add(collectionSizeIX);
    tx.feePayer = payer.publicKey;

    // send the transaction to the cluster
    const txSignature = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });

    console.log("\nCollection successfully created!");
    console.log('mint NFT transaction signature', txSignature);
  } catch (err) {
    console.error("\nFailed to create collection:", err);

    throw err;
  }

  // return all the accounts
  return { mint, tokenAccount, metadataAccount, masterEditionAccount };
}
