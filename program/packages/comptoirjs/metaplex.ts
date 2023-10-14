import { Connection, PublicKey } from '@solana/web3.js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Metaplex } from '@metaplex-foundation/js';

export const getMetadata = async (connection: Connection, mint: PublicKey): Promise<Metadata> => {
  return await Metadata.fromAccountAddress(connection, mint);
};

export const getMetadataPDA = (connection: Connection, mint: PublicKey) => {
  return Metaplex.make(connection).nfts().pdas().metadata({ mint: mint });
}