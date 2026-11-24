import type { Hex } from "viem";
import { chainGatewayGet } from "@/lib/chain-identity/gateway";

/**
 * Rule version 7's reads on the public chain gateway (its waves routes:
 * waves, decisions, entries, votes, polls, wave REP), at the head, so a
 * write is drafted against the state its block will run on.
 */

export interface ChainWave {
  readonly waveId: Hex;
  readonly legacyId: string | null;
  readonly version: number;
  readonly controller: Hex;
  readonly status: "open" | "closed";
  readonly policyVersion: number;
}

export interface ChainDecision {
  readonly decisionId: Hex;
  readonly legacyId: string | null;
  readonly waveId: Hex;
  readonly configVersion: number;
  readonly status: "draft" | "published" | "ended" | "archived";
  readonly kind: "rank" | "approve";
  /** DecisionConfig by field name; 64-bit values as decimal strings. */
  readonly config: Readonly<Record<string, unknown>>;
  readonly due: boolean;
}

export interface ChainEntry {
  readonly entryId: Hex;
  readonly legacyId: string | null;
  readonly decisionId: Hex;
  readonly author: Hex;
  readonly version: number;
  readonly status: "active" | "winner" | "withdrawn" | "disqualified";
  readonly total: string;
}

export interface ChainVoterVotes {
  readonly decisionId: Hex;
  readonly voter: Hex;
  readonly votes: readonly {
    readonly entryId: Hex;
    readonly value: string;
    readonly updatedHeight: number;
  }[];
}

export interface ChainPoll {
  readonly pollId: Hex;
  readonly legacyId: string | null;
  readonly waveId: Hex;
  readonly optionCount: number;
  readonly maxChoices: number;
  readonly closeTime: number;
  readonly snapshotDay: number;
  readonly status: "open" | "closed";
  /** The least TDH a ballot's cluster needs, a decimal string. */
  readonly minTdh?: string;
}

interface ChainPollBallot {
  readonly cid: Hex;
  readonly selection: number;
  readonly version: number;
}

export interface ChainTdhLeaf {
  readonly wallet: Hex;
  readonly cid: Hex;
  readonly identityTdh: string;
  /** The wallet's own TDH, which a cluster above 16 wallets is read by. */
  readonly walletTdh?: string;
  readonly walletCount: number;
}

export interface ChainTdhWallet {
  readonly day: number;
  readonly wallet: Hex;
  readonly leaf: ChainTdhLeaf | null;
  readonly principalId: Hex | null;
}

export interface ChainWaveRating {
  readonly rater: Hex;
  readonly target: Hex;
  readonly category: { readonly id: Hex; readonly name: string | null };
  readonly value: number | string;
  readonly updatedHeight: number;
}

const HEAD = { at: "head" } as const;
const lower = (value: string): string => value.toLowerCase();
// chain-state `family::POLL_BALLOT`, as a ballots page's cursor starts.
const POLL_BALLOT_FAMILY = "060c";

export const wavesGateway = {
  getWave: (waveId: Hex, signal?: AbortSignal) =>
    chainGatewayGet<ChainWave | null>(`/v1/waves/${lower(waveId)}`, {
      signal,
      query: HEAD,
      nullOn404: true,
    }),

  getWaveByLegacy: (uuid: string, signal?: AbortSignal) =>
    chainGatewayGet<ChainWave | null>(
      `/v1/waves/by-legacy/${encodeURIComponent(lower(uuid))}`,
      { signal, query: HEAD, nullOn404: true }
    ),

  getDecision: (decisionId: Hex, signal?: AbortSignal) =>
    chainGatewayGet<ChainDecision | null>(
      `/v1/decisions/${lower(decisionId)}`,
      { signal, query: HEAD, nullOn404: true }
    ),

  getEntry: (entryId: Hex, signal?: AbortSignal) =>
    chainGatewayGet<ChainEntry | null>(`/v1/entries/${lower(entryId)}`, {
      signal,
      query: HEAD,
      nullOn404: true,
    }),

  getEntryByLegacy: (uuid: string, signal?: AbortSignal) =>
    chainGatewayGet<ChainEntry | null>(
      `/v1/entries/by-legacy/${encodeURIComponent(lower(uuid))}`,
      { signal, query: HEAD, nullOn404: true }
    ),

  getVoterVotes: (decisionId: Hex, voter: Hex, signal?: AbortSignal) =>
    chainGatewayGet<ChainVoterVotes | null>(
      `/v1/decisions/${lower(decisionId)}/voters/${lower(voter)}`,
      { signal, query: HEAD, nullOn404: true }
    ),

  getPoll: (pollId: Hex, signal?: AbortSignal) =>
    chainGatewayGet<ChainPoll | null>(`/v1/polls/${lower(pollId)}`, {
      signal,
      query: HEAD,
      nullOn404: true,
    }),

  getPollByLegacy: (uuid: string, signal?: AbortSignal) =>
    chainGatewayGet<ChainPoll | null>(
      `/v1/polls/by-legacy/${encodeURIComponent(lower(uuid))}`,
      { signal, query: HEAD, nullOn404: true }
    ),

  /**
   * The cluster's ballot in the poll, or null when it has none yet. The
   * ballots page by state key, `PollBallot[(pollId, cid)]` (family 0x060c,
   * then the poll id, then the cid), so a cursor just below the cid's key
   * lands on its ballot, however many the poll holds.
   */
  findPollBallot: async (
    pollId: Hex,
    cid: Hex,
    signal?: AbortSignal
  ): Promise<ChainPollBallot | null> => {
    const before = BigInt(cid) - 1n;
    const after =
      before < 0n
        ? undefined
        : `0x${POLL_BALLOT_FAMILY}${lower(pollId).slice(2)}${before
            .toString(16)
            .padStart(64, "0")}`;
    const rows = await chainGatewayGet<readonly ChainPollBallot[]>(
      `/v1/polls/${lower(pollId)}/ballots`,
      { signal, query: { ...HEAD, limit: 1, after } }
    );
    const row = rows[0];
    return row && lower(row.cid) === lower(cid) ? row : null;
  },

  /**
   * The wallet's leaf on one TDH day, or null when the day's list doesn't
   * hold it; undefined when this node no longer keeps that day (it keeps
   * the latest two).
   */
  getTdhDayWallet: async (
    day: number,
    wallet: Hex,
    signal?: AbortSignal
  ): Promise<ChainTdhLeaf | null | undefined> => {
    const before = BigInt(wallet) - 1n;
    const after = `0x${before.toString(16).padStart(40, "0")}`;
    const page = await chainGatewayGet<{
      readonly rows: readonly ChainTdhLeaf[];
    } | null>(`/v1/tdh/days/${day}/wallets`, {
      signal,
      query: { ...HEAD, after: before < 0n ? undefined : after, limit: 1 },
      nullOn404: true,
    });
    if (page === null) {
      return undefined;
    }
    const row = page.rows[0];
    return row && lower(row.wallet) === lower(wallet) ? row : null;
  },

  getTdhWallet: (wallet: Hex, signal?: AbortSignal) =>
    chainGatewayGet<ChainTdhWallet | null>(`/v1/tdh/wallets/${lower(wallet)}`, {
      signal,
      query: HEAD,
      nullOn404: true,
    }),

  /** The wave REP a principal gave (state matter 3). */
  getWaveRatingsByRater: (rater: Hex, signal?: AbortSignal) =>
    chainGatewayGet<readonly ChainWaveRating[]>(
      `/v1/ratings/by-rater/${lower(rater)}`,
      { signal, query: { ...HEAD, matter: "wave", limit: 1000 } }
    ),
};
