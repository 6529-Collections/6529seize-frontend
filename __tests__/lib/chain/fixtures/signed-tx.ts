/**
 * Signed test transactions for the mock chain. The private key is
 * synthetic test data and controls nothing.
 */
import { keccak256, stringToBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { encodeSignedTx, txHeader, txIdOf, type ChainNetwork } from "@/lib/chain/codec/envelope";
import { addressKeyId, derivedId, ObjectKind } from "@/lib/chain/codec/ids";
import { EXAMPLE_DEVNET } from "@/lib/chain/codec/network";
import { VOTE_SET } from "@/lib/chain/codec/ops";
import { MOCK_GENESIS_TIME_MS } from "@/lib/chain/mock/chain";

const TEST_PRIVATE_KEY: Hex = `0x${"42".repeat(32)}`;
export const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
export const TEST_PRINCIPAL: Hex = keccak256(stringToBytes("mock principal"));
export const TEST_COMPETITION: Hex = derivedId(
  keccak256(stringToBytes("example wave")),
  0n,
  ObjectKind.COMPETITION
);

export interface VoteOptions {
  readonly nonce?: bigint;
  readonly amount?: bigint;
  readonly expiresAt?: bigint;
  readonly network?: ChainNetwork;
}

export async function signedVote(options: VoteOptions = {}): Promise<{ bytes: Uint8Array; txId: Hex }> {
  const network = options.network ?? EXAMPLE_DEVNET;
  const unsigned = {
    networkId: network.networkId,
    header: txHeader({
      principal: TEST_PRINCIPAL,
      keyType: 1,
      keyId: addressKeyId(testAccount.address),
      nonce: options.nonce ?? 0n,
      notBefore: MOCK_GENESIS_TIME_MS,
      expiresAt: options.expiresAt ?? MOCK_GENESIS_TIME_MS + 3_600_000n,
      maxWork: 3_000_000n,
    }),
    op: VOTE_SET,
    body: {
      competitionId: TEST_COMPETITION,
      expectedConfigVersion: 1,
      entryId: keccak256(stringToBytes("example entry")),
      amount: options.amount ?? 250n,
      priorVoteVersion: 0n,
      budgetScope: 1,
    },
  };
  const txId = txIdOf(unsigned);
  const sig = await testAccount.sign({ hash: txId });
  const bytes = encodeSignedTx({ ...unsigned, signatures: [{ role: 0, keyType: 1, sig, proof: "0x" }] });
  return { bytes, txId };
}
