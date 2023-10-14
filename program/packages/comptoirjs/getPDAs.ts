import { COMPTOIR_PROGRAM_ID } from './constant';
import { PublicKey } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

export const getComptoirPDA = (owner: PublicKey, programID?: PublicKey): PublicKey => {
  return (
    PublicKey.findProgramAddressSync(
      [Buffer.from('COMPTOIR'), owner.toBuffer()],
      programID ? programID : COMPTOIR_PROGRAM_ID
    )
  )[0];
};

export const getEscrowPDA = (
  comptoirPDA: PublicKey,
  comptoirMint: PublicKey,
  programID?: PublicKey
): PublicKey => {
  return (
    PublicKey.findProgramAddressSync(
      [
        Buffer.from('COMPTOIR'),
        comptoirPDA.toBuffer(),
        comptoirMint.toBuffer(),
        Buffer.from('ESCROW'),
      ],
        programID ? programID : COMPTOIR_PROGRAM_ID
    )
  )[0];
};

export const getCollectionPDA = (
  comptoirPDA: PublicKey,
  name: string,
  programID?: PublicKey
): PublicKey => {
  return (
    PublicKey.findProgramAddressSync(
      [Buffer.from('COMPTOIR'), Buffer.from(name), comptoirPDA.toBuffer()],
        programID ? programID : COMPTOIR_PROGRAM_ID
    )
  )[0];
};

export const getNftVaultPDA = (
  nftMint: PublicKey,
  programID?: PublicKey
): PublicKey => {
  return (
    PublicKey.findProgramAddressSync(
      [Buffer.from('COMPTOIR'), Buffer.from('vault'), nftMint.toBuffer()],
        programID ? programID : COMPTOIR_PROGRAM_ID
    )
  )[0];
};

export const getSellOrderPDA = (
  sellerTokenAccount: PublicKey,
  price: BN,
  programID?: PublicKey
): PublicKey => {
  return (
    PublicKey.findProgramAddressSync(
      [
        Buffer.from('COMPTOIR'),
        sellerTokenAccount.toBuffer(),
        Buffer.from(price.toString()),
      ],
        programID ? programID : COMPTOIR_PROGRAM_ID
    )
  )[0];
};

export const getAssociatedTokenAddress = (
  addr: PublicKey,
  mint: PublicKey,
): PublicKey => {
  return getAssociatedTokenAddressSync(
    mint,
    addr,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
};
export const getBuyOfferPDA = (
  comptoirPDA: PublicKey,
  buyer: PublicKey,
  mint: PublicKey,
  price: BN,
  programID?: PublicKey
): PublicKey => {
  return (
    PublicKey.findProgramAddressSync(
      [
        Buffer.from('COMPTOIR'),
        comptoirPDA.toBuffer(),
        buyer.toBuffer(),
        mint.toBuffer(),
        Buffer.from(price.toString()),
        Buffer.from('ESCROW'),
      ],
        programID ? programID : COMPTOIR_PROGRAM_ID
    )
  )[0];
};

export const getMetadataPDA = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata", "utf8"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

export const getMasterEditionPDA = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition", "utf8"),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}