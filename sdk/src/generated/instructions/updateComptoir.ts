/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * @category Instructions
 * @category UpdateComptoir
 * @category generated
 */
export type UpdateComptoirInstructionArgs = {
  optionalFees: beet.COption<number>
  optionalFeesDestination: beet.COption<web3.PublicKey>
  optionalAuthority: beet.COption<web3.PublicKey>
}
/**
 * @category Instructions
 * @category UpdateComptoir
 * @category generated
 */
export const updateComptoirStruct = new beet.FixableBeetArgsStruct<
  UpdateComptoirInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['optionalFees', beet.coption(beet.u16)],
    ['optionalFeesDestination', beet.coption(beetSolana.publicKey)],
    ['optionalAuthority', beet.coption(beetSolana.publicKey)],
  ],
  'UpdateComptoirInstructionArgs'
)
/**
 * Accounts required by the _updateComptoir_ instruction
 *
 * @property [**signer**] authority
 * @property [_writable_] comptoir
 * @category Instructions
 * @category UpdateComptoir
 * @category generated
 */
export type UpdateComptoirInstructionAccounts = {
  authority: web3.PublicKey
  comptoir: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updateComptoirInstructionDiscriminator = [
  249, 151, 213, 178, 44, 0, 146, 204,
]

/**
 * Creates a _UpdateComptoir_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category UpdateComptoir
 * @category generated
 */
export function createUpdateComptoirInstruction(
  accounts: UpdateComptoirInstructionAccounts,
  args: UpdateComptoirInstructionArgs,
  programId = new web3.PublicKey('FCoMPzD3cihsM7EBSbXtorF2yHL4jJ6vrbWtdVaN7qZc')
) {
  const [data] = updateComptoirStruct.serialize({
    instructionDiscriminator: updateComptoirInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.authority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.comptoir,
      isWritable: true,
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
