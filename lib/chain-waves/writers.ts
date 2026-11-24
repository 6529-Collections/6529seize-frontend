import { concat, keccak256, pad, stringToBytes, toHex, type Hex } from "viem";
import type { Config } from "wagmi";
import type { ChainIdentity } from "@/lib/chain-identity/gateway";
import {
  OP_POLL_BALLOT_SET,
  OP_RATING_SET,
  OP_VOTE_SET,
  type ChainActor,
} from "@/lib/chain-identity/identityOps";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  wavesGateway,
  type ChainDecision,
  type ChainEntry,
  type ChainPoll,
} from "./gateway";
import { resolveEntry, resolvePoll, resolveWave } from "./ids";
import {
  pollBallotSet,
  pollSelection,
  voteSet,
  waveRatingCategoryId,
  waveRatingSet,
  type ChainOperationRequest,
} from "./ops";
import {
  identityOfWallet,
  runChainWrite,
  sessionOrWalletSigning,
  type ChainSigning,
} from "./signing";

/**
 * Votes, poll ballots and wave REP on the 6529 Network. Each is signed by
 * this browser's session key when its grant lists the operation, else by
 * the connected wallet, and returns once a block holds it.
 */

const lower = (value: string): string => value.toLowerCase();

/**
 * Votes, ballots and ratings return once a block holds them with their
 * result known: a later write replaces them, so the wait for finality buys
 * nothing a voter needs.
 */
async function run(
  build: (actor: ChainActor) => ChainOperationRequest,
  signing: ChainSigning,
  signal?: AbortSignal
): Promise<void> {
  await runChainWrite(build, signing, "included", signal);
}

const asBigInt = (value: unknown): bigint | null => {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  return typeof value === "string" && /^-?\d+$/.test(value)
    ? BigInt(value)
    : null;
};

const refuse = (sentence: string): never => {
  throw new ChainOperationError("rejected", sentence);
};

/**
 * A clock a little off leaves the edges of a time window to the chain: the
 * page refuses only a write clearly outside it.
 */
const CLOCK_MARGIN_MS = 60_000;

const asNumber = (value: unknown): number | null => {
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Throws, with the sentence the chain would refuse it with, a vote the 6529
 * Network would refuse for what the decision and the entry already say
 * (chain-exec `decisions/vote.rs` checks 2, 5, 6, 8 and 12 to 14). Sent, each
 * would be refused in a block and still pay its fee. A vote taken back to 0
 * from an entry no longer in the running, or a closed decision, is always
 * taken.
 */
export function assertVoteTakeable(
  decision: ChainDecision,
  entry: ChainEntry,
  amount: bigint,
  hasPriorVote: boolean,
  nowMs: number
): void {
  const closed = decision.status === "ended" || decision.status === "archived";
  if (amount === 0n && hasPriorVote && (entry.status !== "active" || closed)) {
    return;
  }
  if (decision.status !== "published") {
    refuse("This decision isn't open.");
  }
  if (decision.due) {
    refuse("This decision is counting its result. Try again in a few minutes.");
  }
  const start = asNumber(decision.config["votingStart"]) ?? 0;
  const end = asNumber(decision.config["votingEnd"]) ?? 0;
  if (
    start > nowMs + CLOCK_MARGIN_MS ||
    (end !== 0 && nowMs > end + CLOCK_MARGIN_MS)
  ) {
    refuse("Voting is closed in this decision.");
  }
  if (entry.status !== "active") {
    refuse("This entry no longer takes votes.");
  }
  const min = asBigInt(decision.config["minVote"]);
  const max = asBigInt(decision.config["maxVote"]);
  const cap = asBigInt(decision.config["perEntryCap"]);
  if (amount < 0n && min !== null && min >= 0n) {
    refuse("Negative votes aren't allowed in this decision.");
  }
  if (min !== null && max !== null && (amount < min || amount > max)) {
    refuse("This vote is outside the range this decision allows.");
  }
  const size = amount < 0n ? -amount : amount;
  if (cap !== null && cap !== 0n && size > cap) {
    refuse("This vote is above the limit for one entry.");
  }
}

/**
 * Sets the connected wallet's identity's vote on the entry a drop is to
 * `amount` (absolute, as 6529.io's vote is).
 */
export async function writeChainVote(
  config: Config,
  wallet: Hex,
  input: { readonly dropId: string; readonly amount: bigint },
  signal?: AbortSignal
): Promise<void> {
  const voter = await identityOfWallet(wallet, signal);
  const entry = await resolveEntry(input.dropId, signal);
  const decision = await wavesGateway.getDecision(entry.decisionId, signal);
  if (!decision || lower(decision.decisionId) !== lower(entry.decisionId)) {
    throw new ChainOperationError(
      "rejected",
      "This entry's decision isn't on the 6529 Network."
    );
  }
  const budgetScope = asNumber(decision.config["creditScope"]);
  if (budgetScope === null) {
    throw new ChainOperationError(
      "rejected",
      "The 6529 Network didn't give this decision's credit scope."
    );
  }
  const votes = await wavesGateway.getVoterVotes(
    decision.decisionId,
    voter.principalId,
    signal
  );
  const prior = votes?.votes.find(
    (vote) => lower(vote.entryId) === lower(entry.entryId)
  );
  // A vote equal to the current one changes nothing: the chain writes
  // nothing for it but still charges the fee, so nothing is sent.
  if ((asBigInt(prior?.value) ?? 0n) === input.amount) {
    return;
  }
  assertVoteTakeable(
    decision,
    entry,
    input.amount,
    prior !== undefined,
    Date.now()
  );
  const signing = await sessionOrWalletSigning(
    config,
    wallet,
    voter.principalId,
    OP_VOTE_SET
  );
  await run(
    (actor) =>
      voteSet(voter.principalId, actor, {
        decisionId: decision.decisionId,
        expectedConfigVersion: decision.configVersion,
        entryId: entry.entryId,
        amount: input.amount,
        priorVoteVersion: prior?.updatedHeight ?? 0,
        budgetScope,
      }),
    signing,
    signal
  );
}

/**
 * The wallet a ballot goes through: the TDH cluster that counts it. The
 * connected wallet when the day's list holds it, else the identity's first
 * wallet the list holds.
 */
/**
 * A TDH cluster above 16 wallets is read as a cluster of each wallet alone
 * (chain-exec `tdh::as_read`): the ballot is kept under that wallet's own
 * cid, `H("6529.TdhIdentity.v1", [w])`, an `address[]` encoded as
 * `abi.encode` does.
 */
const CLUSTER_MAX = 16;
export const loneClusterCid = (wallet: Hex): Hex =>
  keccak256(
    concat([
      keccak256(stringToBytes("6529.TdhIdentity.v1")),
      pad(toHex(64)),
      pad(toHex(1)),
      pad(wallet),
    ])
  );

async function ballotWallet(
  wallet: Hex,
  identity: ChainIdentity,
  snapshotDay: number,
  signal?: AbortSignal
): Promise<{
  readonly wallet: Hex;
  readonly cid: Hex;
  /** The TDH the chain reads for the ballot; null off the snapshot day. */
  readonly tdh: bigint | null;
}> {
  const candidates = [
    wallet,
    ...identity.wallets.filter((item) => lower(item) !== lower(wallet)),
  ];
  for (const candidate of candidates) {
    // The poll counts the cluster on its snapshot day; a node keeps the
    // latest two days, so an older poll reads today's list instead.
    const onDay = await wavesGateway.getTdhDayWallet(
      snapshotDay,
      candidate,
      signal
    );
    const leaf =
      onDay === undefined
        ? (await wavesGateway.getTdhWallet(candidate, signal))?.leaf
        : onDay;
    if (leaf) {
      const alone = leaf.walletCount > CLUSTER_MAX;
      return {
        wallet: candidate,
        cid: alone ? loneClusterCid(candidate) : leaf.cid,
        tdh:
          onDay === undefined
            ? null
            : asBigInt(alone ? leaf.walletTdh : leaf.identityTdh),
      };
    }
  }
  throw new ChainOperationError(
    "rejected",
    "None of this identity's wallets holds TDH, so it has no ballot in this poll."
  );
}

/**
 * Throws a ballot the 6529 Network would refuse for what the poll already
 * says (chain-exec `handlers/polls.rs` checks 2 and 7), before anything is
 * signed.
 */
export function assertBallotTakeable(
  poll: ChainPoll,
  selection: number,
  nowMs: number
): void {
  if (
    poll.status === "closed" ||
    (poll.closeTime > 0 && nowMs >= poll.closeTime + CLOCK_MARGIN_MS)
  ) {
    refuse("This poll is closed.");
  }
  const options = poll.optionCount;
  const above = options < 32 && selection >>> options !== 0;
  let chosen = 0;
  for (let bits = selection; bits !== 0; bits >>>= 1) {
    chosen += bits & 1;
  }
  if (above || chosen > poll.maxChoices) {
    refuse("That's more options than this poll allows.");
  }
}

/**
 * Sets the identity's ballot in a drop's poll to `optionNumbers` (6529.io's
 * option numbers, from 1). The ballot belongs to the TDH cluster; the last
 * one set stands.
 */
export async function writeChainPollBallot(
  config: Config,
  wallet: Hex,
  input: {
    readonly pollId: string;
    readonly optionNumbers: readonly number[];
  },
  signal?: AbortSignal
): Promise<void> {
  const voter = await identityOfWallet(wallet, signal);
  const poll = await resolvePoll(input.pollId, signal);
  const selection = pollSelection(input.optionNumbers);
  assertBallotTakeable(poll, selection, Date.now());
  const through = await ballotWallet(wallet, voter, poll.snapshotDay, signal);
  // Below the poll's least TDH on its snapshot day, the chain refuses the
  // ballot (POLL_NOT_ELIGIBLE) in a block.
  const minTdh = asBigInt(poll.minTdh) ?? 0n;
  if (through.tdh !== null && through.tdh < minTdh) {
    refuse("You can't answer this poll.");
  }
  const prior = await wavesGateway.findPollBallot(
    poll.pollId,
    through.cid,
    signal
  );
  // The chain refuses a ballot that changes nothing (NO_CHANGE), in a block.
  if (prior && prior.version !== 0 && prior.selection === selection) {
    refuse("That's already your answer in this poll.");
  }
  const signing = await sessionOrWalletSigning(
    config,
    wallet,
    voter.principalId,
    OP_POLL_BALLOT_SET
  );
  await run(
    (actor) =>
      pollBallotSet(voter.principalId, actor, {
        pollId: poll.pollId,
        selection,
        priorVersion: prior?.version ?? 0,
        wallet: through.wallet,
      }),
    signing,
    signal
  );
}

/** Sets the identity's wave REP for a wave and category to `value`. */
export async function writeChainWaveRating(
  config: Config,
  wallet: Hex,
  input: {
    readonly waveId: string;
    readonly category: string;
    readonly value: bigint;
  },
  signal?: AbortSignal
): Promise<void> {
  const rater = await identityOfWallet(wallet, signal);
  const wave = await resolveWave(input.waveId, signal);
  const categoryId = waveRatingCategoryId(input.category);
  const rows = await wavesGateway.getWaveRatingsByRater(
    rater.principalId,
    signal
  );
  const prior = rows.find(
    (row) =>
      lower(row.target) === lower(wave.waveId) &&
      lower(row.category.id) === categoryId
  );
  const signing = await sessionOrWalletSigning(
    config,
    wallet,
    rater.principalId,
    OP_RATING_SET
  );
  await run(
    (actor) =>
      waveRatingSet(rater.principalId, actor, {
        waveId: wave.waveId,
        category: input.category,
        value: input.value,
        priorVersion: prior?.updatedHeight ?? 0,
      }),
    signing,
    signal
  );
}
