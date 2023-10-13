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
 * @category Buy
 * @category generated
 */
export type BuyInstructionArgs = {
  askQuantity: beet.bignum
}
/**
 * @category Instructions
 * @category Buy
 * @category generated
 */
export const buyStruct = new beet.BeetArgsStruct<
  BuyInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['askQuantity', beet.u64],
  ],
  'BuyInstructionArgs'
)
/**
 * Accounts required by the _buy_ instruction
 *
 * @property [**signer**] buyer
 * @property [_writable_] buyerNftTokenAccount
 * @property [_writable_] buyerPayingTokenAccount
 * @property [] comptoir
 * @property [_writable_] comptoirDestAccount
 * @property [] collection
 * @property [] mintMetadata
 * @property [_writable_] vault
 * @category Instructions
 * @category Buy
 * @category generated
 */
export type BuyInstructionAccounts = {
  buyer: web3.PublicKey
  buyerNftTokenAccount: web3.PublicKey
  buyerPayingTokenAccount: web3.PublicKey
  comptoir: web3.PublicKey
  comptoirDestAccount: web3.PublicKey
  collection: web3.PublicKey
  mintMetadata: web3.PublicKey
  vault: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const buyInstructionDiscriminator = [102, 6, 61, 18, 1, 218, 235, 234]

/**
 * Creates a _Buy_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category Buy
 * @category generated
 */
export function createBuyInstruction(
  accounts: BuyInstructionAccounts,
  args: BuyInstructionArgs,
  programId = new web3.PublicKey('EZxFrEd1TBL6A1zzSvcasnR7RyEwRqkLmBjvLsSCaKNc')
) {
  const [data] = buyStruct.serialize({
    instructionDiscriminator: buyInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.buyer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.buyerNftTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.buyerPayingTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.comptoir,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.comptoirDestAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.collection,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.mintMetadata,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.vault,
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
