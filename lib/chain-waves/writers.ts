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
import { wavesGateway } from "./gateway";
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

const asNumber = (value: unknown): number | null => {
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

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
): Promise<{ readonly wallet: Hex; readonly cid: Hex }> {
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
      return {
        wallet: candidate,
        cid:
          leaf.walletCount > CLUSTER_MAX ? loneClusterCid(candidate) : leaf.cid,
      };
    }
  }
  throw new ChainOperationError(
    "rejected",
    "None of this identity's wallets holds TDH, so it has no ballot in this poll."
  );
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
  const through = await ballotWallet(wallet, voter, poll.snapshotDay, signal);
  const prior = await wavesGateway.findPollBallot(
    poll.pollId,
    through.cid,
    signal
  );
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
        selection: pollSelection(input.optionNumbers),
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
