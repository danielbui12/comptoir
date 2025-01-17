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
 * @category AddQuantityToSellOrder
 * @category generated
 */
export type AddQuantityToSellOrderInstructionArgs = {
  quantityToAdd: beet.bignum
}
/**
 * @category Instructions
 * @category AddQuantityToSellOrder
 * @category generated
 */
export const addQuantityToSellOrderStruct = new beet.BeetArgsStruct<
  AddQuantityToSellOrderInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['quantityToAdd', beet.u64],
  ],
  'AddQuantityToSellOrderInstructionArgs'
)
/**
 * Accounts required by the _addQuantityToSellOrder_ instruction
 *
 * @property [_writable_, **signer**] authority
 * @property [_writable_] sellerNftTokenAccount
 * @property [_writable_] sellOrder
 * @property [_writable_] vault
 * @category Instructions
 * @category AddQuantityToSellOrder
 * @category generated
 */
export type AddQuantityToSellOrderInstructionAccounts = {
  authority: web3.PublicKey
  sellerNftTokenAccount: web3.PublicKey
  sellOrder: web3.PublicKey
  vault: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  rent?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const addQuantityToSellOrderInstructionDiscriminator = [
  195, 215, 132, 169, 2, 103, 47, 168,
]

/**
 * Creates a _AddQuantityToSellOrder_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category AddQuantityToSellOrder
 * @category generated
 */
export function createAddQuantityToSellOrderInstruction(
  accounts: AddQuantityToSellOrderInstructionAccounts,
  args: AddQuantityToSellOrderInstructionArgs,
  programId = new web3.PublicKey('FY4tLSXn95o5YuecY3sAfPCoPk9ZSs2cvFa9HiHYPFgy')
) {
  const [data] = addQuantityToSellOrderStruct.serialize({
    instructionDiscriminator: addQuantityToSellOrderInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.sellerNftTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.sellOrder,
      isWritable: true,
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
