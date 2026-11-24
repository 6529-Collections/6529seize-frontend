import type { Hex } from "viem";
import { repCategoryId } from "@/lib/chain/codec/ids";
import { isRepCategoryName } from "@/lib/chain/codec/rules";
import type { ChainDraftRequest } from "@/lib/chain-identity/gateway";
import type { ChainActor } from "@/lib/chain-identity/identityOps";
import { ChainOperationError } from "@/lib/chain-identity/operation";

/**
 * Rule version 7's operations this site writes, as `/v1/draft` requests with
 * the EIP-712 primary type each draft must carry. Field names follow the
 * chain's schema registry (chain-tx `schema.rs`; P40 8.6, P61 1.16 4.8 and
 * 4.12, and RATING_SET's wave target, 1.15 3.10).
 */

export interface ChainOperationRequest {
  readonly request: ChainDraftRequest;
  readonly primaryType: string;
}

const ZERO_WORD: Hex = `0x${"00".repeat(32)}`;
const INT64_MAX = (1n << 63n) - 1n;
const RATING_MATTER_REP = 1;
const TARGET_WAVE = 2;
/** POLL_BALLOT_SET's `selection` is a uint32: one bit an option. */
const MAX_POLL_OPTIONS = 32;

const signerFields = (
  actor: ChainActor
): Pick<ChainDraftRequest, "signer" | "keyType" | "keyId" | "authRef"> =>
  actor.kind === "wallet"
    ? { keyType: 1, signer: actor.address.toLowerCase() as Hex }
    : { keyType: 2, keyId: actor.keyId, authRef: actor.grantId };

export const chainOperation = (
  opType: string,
  primaryType: string,
  principal: Hex,
  actor: ChainActor,
  body: Readonly<Record<string, unknown>>
): ChainOperationRequest => ({
  primaryType,
  request: {
    opType,
    principal: principal.toLowerCase() as Hex,
    ...signerFields(actor),
    body,
  },
});

const word = (value: Hex): Hex => value.toLowerCase() as Hex;

const int64 = (value: bigint, field: string): string => {
  if (value > INT64_MAX || value < -INT64_MAX) {
    throw new ChainOperationError(
      "rejected",
      "That number is outside what the 6529 Network takes.",
      null,
      { field }
    );
  }
  return value.toString();
};

/** VOTE_SET: the voter's absolute vote on an entry of a decision. */
export const voteSet = (
  principal: Hex,
  actor: ChainActor,
  input: {
    readonly decisionId: Hex;
    readonly expectedConfigVersion: number;
    readonly entryId: Hex;
    readonly amount: bigint;
    readonly priorVoteVersion: number;
    readonly budgetScope: number;
  }
): ChainOperationRequest =>
  chainOperation("VOTE_SET", "VoteSet", principal, actor, {
    decisionId: word(input.decisionId),
    expectedConfigVersion: input.expectedConfigVersion,
    entryId: word(input.entryId),
    amount: int64(input.amount, "amount"),
    priorVoteVersion: input.priorVoteVersion.toString(),
    budgetScope: input.budgetScope,
  });

/**
 * The ballot's `selection`: bit k for option k (option 0 first). 6529.io
 * numbers poll options from 1.
 */
export function pollSelection(optionNumbers: readonly number[]): number {
  if (optionNumbers.length === 0) {
    throw new ChainOperationError("rejected", "Choose at least one option.");
  }
  let selection = 0;
  for (const optionNo of optionNumbers) {
    if (
      !Number.isInteger(optionNo) ||
      optionNo < 1 ||
      optionNo > MAX_POLL_OPTIONS
    ) {
      throw new ChainOperationError(
        "rejected",
        "That isn't an option in this poll."
      );
    }
    selection |= 1 << (optionNo - 1);
  }
  // `>>> 0` keeps bit 31 a positive uint32.
  return selection >>> 0;
}

/** POLL_BALLOT_SET: the TDH cluster's ballot, through one of p's wallets. */
export const pollBallotSet = (
  principal: Hex,
  actor: ChainActor,
  input: {
    readonly pollId: Hex;
    readonly selection: number;
    readonly priorVersion: number;
    readonly wallet: Hex;
  }
): ChainOperationRequest =>
  chainOperation("POLL_BALLOT_SET", "PollBallotSet", principal, actor, {
    pollId: word(input.pollId),
    selection: input.selection,
    priorVersion: input.priorVersion,
    wallet: input.wallet.toLowerCase(),
  });

/**
 * RATING_SET with a WAVE target: wave REP. The body says `matter` 1 (REP);
 * the chain keeps it under wave REP's own matter. An empty category is
 * 6529.io's uncategorised wave REP, category zero.
 */
/** A wave REP category's id: zero for 6529.io's uncategorised wave REP. */
export function waveRatingCategoryId(name: string): Hex {
  const category = name.trim();
  if (category !== "" && !isRepCategoryName(category)) {
    throw new ChainOperationError(
      "rejected",
      "On the 6529 Network a category uses only letters A-Z, numbers, single spaces and & ' . - _, and starts with a letter or number."
    );
  }
  return category === "" ? ZERO_WORD : repCategoryId(category);
}

export function waveRatingSet(
  principal: Hex,
  actor: ChainActor,
  input: {
    readonly waveId: Hex;
    readonly category: string;
    readonly value: bigint;
    readonly priorVersion: number;
  }
): ChainOperationRequest {
  const category = input.category.trim();
  return chainOperation("RATING_SET", "RatingSet", principal, actor, {
    matter: RATING_MATTER_REP,
    targetKind: TARGET_WAVE,
    target: word(input.waveId),
    category: waveRatingCategoryId(category),
    categoryName: category,
    value: int64(input.value, "value"),
    priorVersion: input.priorVersion.toString(),
  });
}
