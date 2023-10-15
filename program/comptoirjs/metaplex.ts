import { Connection, PublicKey } from '@solana/web3.js';
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

export const getMetadata = async (connection: Connection, metadataPda: PublicKey): Promise<Metadata> => {
  return await Metadata.fromAccountAddress(connection, metadataPda);
};
