/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category CreateBuyOffer
 * @category generated
 */
export type CreateBuyOfferInstructionArgs = {
  priceProposition: beet.bignum
}
/**
 * @category Instructions
 * @category CreateBuyOffer
 * @category generated
 */
export const createBuyOfferStruct = new beet.BeetArgsStruct<
  CreateBuyOfferInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['priceProposition', beet.u64],
  ],
  'CreateBuyOfferInstructionArgs'
)
/**
 * Accounts required by the _createBuyOffer_ instruction
 *
 * @property [_writable_, **signer**] payer
 * @property [] nftMint
 * @property [] metadata
 * @property [] comptoir
 * @property [_writable_] collection
 * @property [_writable_] escrow
 * @property [_writable_] buyerPayingAccount
 * @property [_writable_] buyerNftAccount
 * @property [_writable_] buyOffer
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category CreateBuyOffer
 * @category generated
 */
export type CreateBuyOfferInstructionAccounts = {
  payer: web3.PublicKey
  nftMint: web3.PublicKey
  metadata: web3.PublicKey
  comptoir: web3.PublicKey
  collection: web3.PublicKey
  escrow: web3.PublicKey
  buyerPayingAccount: web3.PublicKey
  buyerNftAccount: web3.PublicKey
  buyOffer: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
  rent?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const createBuyOfferInstructionDiscriminator = [
  183, 83, 4, 172, 109, 110, 114, 118,
]

/**
 * Creates a _CreateBuyOffer_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CreateBuyOffer
 * @category generated
 */
export function createCreateBuyOfferInstruction(
  accounts: CreateBuyOfferInstructionAccounts,
  args: CreateBuyOfferInstructionArgs,
  programId = new web3.PublicKey('EZxFrEd1TBL6A1zzSvcasnR7RyEwRqkLmBjvLsSCaKNc')
) {
  const [data] = createBuyOfferStruct.serialize({
    instructionDiscriminator: createBuyOfferInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.nftMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.metadata,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.comptoir,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.collection,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.escrow,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.buyerPayingAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.buyerNftAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.buyOffer,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.associatedTokenProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
