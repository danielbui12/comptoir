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
 * @category RemoveSellOrder
 * @category generated
 */
export type RemoveSellOrderInstructionArgs = {
  quantityToUnlist: beet.bignum
}
/**
 * @category Instructions
 * @category RemoveSellOrder
 * @category generated
 */
export const removeSellOrderStruct = new beet.BeetArgsStruct<
  RemoveSellOrderInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['quantityToUnlist', beet.u64],
  ],
  'RemoveSellOrderInstructionArgs'
)
/**
 * Accounts required by the _removeSellOrder_ instruction
 *
 * @property [_writable_, **signer**] authority
 * @property [_writable_] sellerNftTokenAccount
 * @property [_writable_] sellOrder
 * @property [_writable_] vault
 * @category Instructions
 * @category RemoveSellOrder
 * @category generated
 */
export type RemoveSellOrderInstructionAccounts = {
  authority: web3.PublicKey
  sellerNftTokenAccount: web3.PublicKey
  sellOrder: web3.PublicKey
  vault: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  rent?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const removeSellOrderInstructionDiscriminator = [
  57, 120, 155, 176, 154, 186, 201, 80,
]

/**
 * Creates a _RemoveSellOrder_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category RemoveSellOrder
 * @category generated
 */
export function createRemoveSellOrderInstruction(
  accounts: RemoveSellOrderInstructionAccounts,
  args: RemoveSellOrderInstructionArgs,
  programId = new web3.PublicKey('FY4tLSXn95o5YuecY3sAfPCoPk9ZSs2cvFa9HiHYPFgy')
) {
  const [data] = removeSellOrderStruct.serialize({
    instructionDiscriminator: removeSellOrderInstructionDiscriminator,
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
