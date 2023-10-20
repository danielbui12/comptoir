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
  cacheTime = 60 * 1000 // 60 seconds
  checkPoint = new Date().getTime()

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

  async getComptoir(refreshCache = false): Promise<IdlAccounts<ComptoirDefinition>['comptoir']> {
    if (refreshCache) {
      this.checkPoint = new Date().getTime();
    }
    if (new Date().getTime() - this.checkPoint >= this.cacheTime && this.comptoirCache) {
      return this.comptoirCache;
    }    
    if (!this.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }
    this.comptoirCache = await this.program.account.comptoir.fetch(
      this.comptoirPDA
    );
    this.checkPoint = new Date().getTime();
    return this.comptoirCache;
  }

  async updateComptoir(fee: number, comptoirMint: PublicKey, admin: PublicKey, oldAdmin: Keypair): Promise<string> {
    return await this.program.methods
      .updateComptoir(fee, comptoirMint, admin)
      .accounts({
        authority: oldAdmin.publicKey,
        comptoir: this.comptoirPDA as PublicKey,
      })
      .signers([oldAdmin])
      .rpc();
  }

  async updateComptoirMint(
    comptoirMint: PublicKey,
    tokenAccount: PublicKey,
    oldMint: PublicKey,
    admin: Keypair
  ): Promise<string> {
    if (!this.comptoirPDA) {
      throw new Error('comptoirPDA is not set');
    }
    
    const escrowPDA = getEscrowPDA(this.comptoirPDA, comptoirMint, this.programID);    
    return await this.program.methods
      .updateComptoirMint(comptoirMint, tokenAccount)
      .accounts({
        authority: admin.publicKey,
        comptoir: this.comptoirPDA,
        mint: oldMint,
        escrow: escrowPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc()

  }
}
