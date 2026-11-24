import type { ChainDraft } from "./gateway";
import { ChainOperationError } from "./operation";

/**
 * The most fee this browser's session key signs for one operation on its
 * own. Above it the key signs nothing, and the wallet signs once the page
 * has said the fee. The cap is set here, never from the gateway: a wrong or
 * hostile gateway is the case it guards against.
 *
 * It is 20 times the operation's fee at the chain's floor base fees
 * (CHAIN-SPEC 6.3's worst case: the size times the byte fee, plus maxWork
 * times the RU fee), with the size and the work each counted only up to a
 * ceiling below, so nothing the gateway sends lifts it past a fixed amount.
 * A draft's maxFee is about 2.25 times its worst case at the base fees of
 * the moment, so the key keeps signing until base fees reach about 9 times
 * the floor: some 18 full blocks in a row, at an eighth more a block.
 */
const FLOOR_MULTIPLE = 20n;

/** Rule version 5's floors (P61 3.2), in base units: a byte, and an RU. */
const FLOOR_PER_BYTE = 1_600_000_000_000n;
const FLOOR_PER_RU = 16_000_000_000n;

/**
 * The size the cap counts: the gateway's unsigned transaction bytes plus at
 * most this much for the signature entry, up to the ceiling. A gateway that
 * pads the bytes moves the cap only within that ceiling. A session
 * operation is a few hundred bytes.
 */
const SIGNATURE_ENTRY_BYTES = 128n;
const SIZE_CEILING = 2_048n;

/**
 * The most work the cap counts for each operation a session key signs, by
 * its typed data's name: just above the largest maxWork a draft of it can
 * carry (its admission bound, a session signature, the envelope's and
 * handler's state, the client margin of 150,000 RU, and an AccountPolicy's
 * 48,264 RU): 573,564 RU for a wave's REP, 267,364 RU for PROFILE_REPLACE,
 * 737,264 RU for POLL_BALLOT_SET. VOTE_SET walks the voter's stored votes,
 * 20,500 RU each and up to 248 of them, so its largest, 5,887,764 RU, takes
 * the 6,000,000 RU any transaction may carry. The wallet signs any
 * operation not listed.
 */
const WORK_CEILING: ReadonlyMap<string, bigint> = new Map([
  ["PollBallotSet", 800_000n],
  ["ProfileReplace", 300_000n],
  ["RatingSet", 600_000n],
  ["VoteSet", 6_000_000n],
]);

const integer = (value: unknown): bigint | null => {
  if (typeof value === "bigint") {
    return value >= 0n ? value : null;
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
  }
  return typeof value === "string" && /^\d+$/.test(value)
    ? BigInt(value)
    : null;
};

/** The draft's header as it is signed. */
function signedHeader(draft: ChainDraft): Readonly<Record<string, unknown>> {
  const header = draft.typedData.message["header"];
  return typeof header === "object" && header !== null
    ? (header as Readonly<Record<string, unknown>>)
    : {};
}

const atMost = (value: bigint, ceiling: bigint): bigint =>
  value < ceiling ? value : ceiling;

/** The signed transaction's size as the cap counts it; 0 when unreadable. */
function sizeOf(draft: ChainDraft): bigint {
  const hex = draft.unsigned;
  if (!/^0x[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    return 0n;
  }
  return BigInt((hex.length - 2) / 2) + SIGNATURE_ENTRY_BYTES;
}

/** The cap for this draft in base units: 0 for an operation not listed. */
export function sessionFeeCap(draft: ChainDraft): bigint {
  const workCeiling = WORK_CEILING.get(draft.typedData.primaryType);
  const work = integer(signedHeader(draft)["maxWork"]);
  if (workCeiling === undefined || work === null) {
    return 0n;
  }
  return (
    FLOOR_MULTIPLE *
    (atMost(sizeOf(draft), SIZE_CEILING) * FLOOR_PER_BYTE +
      atMost(work, workCeiling) * FLOOR_PER_RU)
  );
}

/** The draft's maxFee as it is signed, or null when its header has none. */
const signedMaxFee = (draft: ChainDraft): bigint | null =>
  integer(signedHeader(draft)["maxFee"]);

/** Whether this browser's session key may sign the draft on its own. */
export function withinSessionFeeCap(draft: ChainDraft): boolean {
  const maxFee = signedMaxFee(draft);
  return maxFee !== null && maxFee <= sessionFeeCap(draft);
}

/**
 * The refusal when the fee is above the cap: the key signed no change.
 * `values` carries the fee in base units, as the draft shows it (which
 * `verifyDraft` matched to the signed header), for the page's sentence.
 */
export const sessionFeeAboveCap = (draft: ChainDraft): ChainOperationError =>
  new ChainOperationError(
    "fee_above_cap",
    "This change's fee is more than this browser's key signs on its own, so the change wasn't sent. Sign it with your wallet.",
    null,
    {
      maxFee: (
        integer(draft.fee.maxFee) ??
        signedMaxFee(draft) ??
        0n
      ).toString(),
    }
  );
