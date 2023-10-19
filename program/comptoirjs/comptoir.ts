import * as anchor from '@project-serum/anchor';
import { Comptoir as ComptoirDefinition } from './types/comptoir';
import { COMPTOIR_PROGRAM_ID } from './constant';
import idl from './types/comptoir.json';
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getCollectionPDA, getComptoirPDA, getEscrowPDA } from './getPDAs';
import { IdlAccounts } from '@project-serum/anchor';

export class Comptoir {
  program: anchor.Program<ComptoirDefinition>;
  comptoirPDA: PublicKey | null;
  programID: PublicKey;

  private comptoirCache?: IdlAccounts<ComptoirDefinition>['comptoir'];

  constructor(provider: anchor.Provider, comptoirPDA?: PublicKey, programID?: PublicKey) {
    this.programID = programID ? programID : COMPTOIR_PROGRAM_ID
    // @ts-ignore
    this.program = new anchor.Program(idl, this.programID, provider);

    this.comptoirPDA = comptoirPDA ?? null;
  }

  async createComptoir(
    owner: Keypair,
    mint: PublicKey,
    fees: number,
    feesDestination: PublicKey
  ): Promise<string> {
    const comptoirPDA = getComptoirPDA(owner.publicKey, this.programID);
    const escrowPDA = getEscrowPDA(comptoirPDA, mint, this.programID);
    const comptoirThat = this;

    return await this.program.methods
      .createComptoir(mint, fees, feesDestination, owner.publicKey)
      .accounts({
        payer: owner.publicKey,
        comptoir: comptoirPDA,
        mint: mint,
        escrow: escrowPDA,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([owner])
      .rpc()
      .then((res) => {
        comptoirThat.comptoirPDA = comptoirPDA;
        return res
      });
  }

  async createCollection(
    authority: Keypair,
    name: string,
    required_metadata_signer: PublicKey,
    collection_symbol: string,
    ignore_creators: boolean,
    fee?: number
  ): Promise<string> {
    if (!this.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }
    console.log('this.comptoirPDA', this.comptoirPDA);
    
    const collectionPDA = getCollectionPDA(
      this.comptoirPDA,
        name,
        this.programID
    );

    return await this.program.methods
      .createCollection(
        name,
        collection_symbol,
        required_metadata_signer,
        fee ? fee : null,
        ignore_creators
      )
      .accounts({
        authority: authority.publicKey,
        comptoir: this.comptoirPDA,
        collection: collectionPDA,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([authority])
      .rpc();
  }

  async getComptoir(): Promise<IdlAccounts<ComptoirDefinition>['comptoir']> {
    if (this.comptoirCache) {
      return this.comptoirCache;
    }
    if (!this.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }
    this.comptoirCache = await this.program.account.comptoir.fetch(
      this.comptoirPDA
    );
    return this.comptoirCache;
  }
}
