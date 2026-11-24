import type { Hex } from "viem";
import { txHeader, txIdOf, ZERO32 } from "@/lib/chain/codec/envelope";
import type { OperationSchema } from "@/lib/chain/codec/ops";
import { OpType, RATING_SET } from "@/lib/chain/codec/ops";
import {
  address,
  bytes32,
  i64,
  struct,
  u32,
  u64,
  u8,
} from "@/lib/chain/codec/schema";
import type { ChainDraft } from "@/lib/chain-identity/gateway";

/**
 * Row-7 drafts as the gateway answers them, each with its txId computed by
 * the chain codec (lib/chain/codec) from the chain's schema registry, a
 * second implementation beside the pinned EIP-712 types and viem.
 */

export const NETWORK_ID: Hex = `0x${"ab".repeat(32)}`;
export const VOTER: Hex = `0x${"11".repeat(32)}`;
export const WALLET: Hex = "0x1111111111111111111111111111111111111111";
export const DECISION: Hex = `0x${"d1".repeat(32)}`;
export const ENTRY: Hex = `0x${"e1".repeat(32)}`;
export const POLL: Hex = `0x${"0b".repeat(32)}`;
export const WAVE: Hex = `0x${"05".repeat(32)}`;

// chain-tx schema.rs, rule version 7: VOTE_SET names the decision
// `decisionId` (lib/chain/codec still says `competitionId`).
const VOTE_SET: OperationSchema = {
  opType: 0x0606,
  opVersion: 1,
  name: "VOTE_SET",
  primaryType: "VoteSet",
  body: struct("VoteSetBody", [
    ["decisionId", bytes32],
    ["expectedConfigVersion", u32],
    ["entryId", bytes32],
    ["amount", i64],
    ["priorVoteVersion", u64],
    ["budgetScope", u8],
  ]),
};

const POLL_BALLOT_SET: OperationSchema = {
  opType: 0x0608,
  opVersion: 1,
  // Not in lib/chain/codec's list; the digest reads opType and the types.
  name: "POLL_BALLOT_SET" as OperationSchema["name"],
  primaryType: "PollBallotSet",
  body: struct("PollBallotSetBody", [
    ["pollId", bytes32],
    ["selection", u32],
    ["priorVersion", u32],
    ["wallet", address],
  ]),
};

export interface Signing {
  readonly keyType?: 1 | 2;
  readonly keyId?: Hex;
  readonly authRef?: Hex;
}

const headerFor = ({ keyType = 1, keyId, authRef = ZERO32 }: Signing) => {
  const resolvedKeyId =
    keyId ?? (`0x${"00".repeat(12)}${WALLET.slice(2)}` as Hex);
  return {
    codec: txHeader({
      ruleVersion: 7,
      principal: VOTER,
      keyType,
      keyId: resolvedKeyId,
      authRef,
      nonce: 4n,
      notBefore: 1_764_000_000_000n,
      expiresAt: 1_764_003_600_000n,
      feeMode: 3,
      maxFee: 3_000_000n,
      maxWork: 900_000n,
    }),
    message: {
      ruleVersion: 7,
      principal: VOTER,
      keyType,
      keyId: resolvedKeyId,
      authRef,
      nonceLane: 0,
      nonce: "4",
      notBefore: "1764000000000",
      expiresAt: "1764003600000",
      ethRefNumber: "0",
      ethRefHash: ZERO32,
      feeMode: 3,
      sponsorRef: ZERO32,
      maxFee: "3000000",
      maxWork: "900000",
      tipPerRU: "0",
    },
    keyType,
  };
};

export function draftOf(
  op: OperationSchema,
  signing: Signing,
  codecBody: Record<string, unknown>,
  messageBody: Record<string, unknown>
): ChainDraft {
  const header = headerFor(signing);
  const txId = txIdOf({
    networkId: NETWORK_ID,
    header: header.codec,
    op,
    body: codecBody as never,
  });
  return {
    txId,
    opType: op.opType,
    opName: op.name,
    opVersion: 1,
    typedData: {
      domain: { name: "6529 Network", version: "1", salt: NETWORK_ID },
      primaryType: op.primaryType,
      // The gateway's own types are never used for signing.
      types: {},
      message: { header: header.message, body: messageBody },
    },
    unsigned: "0x4001",
    envelope: { networkId: NETWORK_ID, header: {} },
    signatures: [
      {
        role: 0,
        keyType: header.keyType,
        signer: header.keyType === 1 ? WALLET : null,
      },
    ],
    fee: {
      maxWork: "900000",
      worst: "1300000",
      maxFee: "3000000",
      sizeBytes: 320,
    },
  };
}

export const voteDraft = (
  input: { readonly amount?: bigint; readonly prior?: bigint } & Signing = {}
): ChainDraft => {
  const amount = input.amount ?? 250n;
  const prior = input.prior ?? 0n;
  return draftOf(
    VOTE_SET,
    input,
    {
      decisionId: DECISION,
      expectedConfigVersion: 2,
      entryId: ENTRY,
      amount,
      priorVoteVersion: prior,
      budgetScope: 1,
    },
    {
      decisionId: DECISION,
      expectedConfigVersion: 2,
      entryId: ENTRY,
      amount: amount.toString(),
      priorVoteVersion: prior.toString(),
      budgetScope: 1,
    }
  );
};

export const ballotDraft = (
  input: { readonly selection?: number } & Signing = {}
): ChainDraft => {
  const selection = input.selection ?? 0b101;
  return draftOf(
    POLL_BALLOT_SET,
    input,
    { pollId: POLL, selection, priorVersion: 1, wallet: WALLET },
    { pollId: POLL, selection, priorVersion: 1, wallet: WALLET }
  );
};

export const waveRatingDraft = (
  input: {
    readonly category: Hex;
    readonly categoryName: string;
    readonly value?: bigint;
  } & Signing
): ChainDraft => {
  const value = input.value ?? 30n;
  return draftOf(
    { ...RATING_SET, opType: OpType.RATING_SET },
    input,
    {
      matter: 1,
      targetKind: 2,
      target: WAVE,
      category: input.category,
      categoryName: input.categoryName,
      value,
      priorVersion: 7n,
    },
    {
      matter: 1,
      targetKind: 2,
      target: WAVE,
      category: input.category,
      categoryName: input.categoryName,
      value: value.toString(),
      priorVersion: "7",
    }
  );
};
