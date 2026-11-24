import type { Hex } from "viem";
import { chainGatewayGet } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { wavesGateway, type ChainDecision, type ChainEntry } from "./gateway";
import { chainIdOf, isChainId, LegacyObjectKind, resolveWave } from "./ids";

/**
 * The reads an entry needs beyond gateway.ts (the gateway's decisions
 * routes): a decision by its chain id or its 6529.io competition id, and a
 * wave's decisions. At the head, as every write's reads are. An imported object's
 * chain id is derived here (ids.ts), and every answer an entry or a
 * withdrawal builds on must name the id asked for, so a gateway can't point
 * a signature at another object.
 */

const HEAD = { at: "head" } as const;
const lower = (value: string): string => value.toLowerCase();
/** The gateway's largest page. */
const WAVE_DECISIONS_PAGE = 500;
/**
 * A wave holds at most maxDecisionsPerWave (64 at rule version 7, 1,024 at
 * most) decisions that aren't archived; archived ones stay listed. Ten
 * pages leave room for years of archived ones.
 */
const WAVE_DECISIONS_PAGES = 10;

export const entryGateway = {
  /**
   * A wave's decisions, every status, ascending by id. The route pages with
   * `after` set to the last decisionId read. chainGatewayGet gives a page's
   * rows without the envelope's `next`, so a full page is followed from its
   * last id, and a page that doesn't move on ends the list.
   */
  getWaveDecisions: async (
    waveId: Hex,
    signal?: AbortSignal
  ): Promise<readonly ChainDecision[]> => {
    const decisions: ChainDecision[] = [];
    let after: string | undefined;
    for (let page = 0; page < WAVE_DECISIONS_PAGES; page += 1) {
      const rows = await chainGatewayGet<readonly ChainDecision[]>(
        `/v1/waves/${lower(waveId)}/decisions`,
        { signal, query: { ...HEAD, limit: WAVE_DECISIONS_PAGE, after } }
      );
      decisions.push(...rows);
      const last = rows.at(-1)?.decisionId;
      if (
        rows.length < WAVE_DECISIONS_PAGE ||
        last === undefined ||
        lower(last) === after
      ) {
        return decisions;
      }
      after = lower(last);
    }
    throw new ChainOperationError(
      "rejected",
      "This wave has more decisions than this page reads. Submit from the decision's own page."
    );
  },
};

const NOT_ON_CHAIN = "This decision isn't on the 6529 Network.";
const OTHER_OBJECT =
  "The 6529 Network gateway answered for a different object. Nothing was signed.";

/** A config value (a decimal string or a number) as a number; 0 if neither. */
const asNumber = (value: unknown): number => {
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Whether the decision's entry window holds `nowMs` (end 0: no end). */
export function isTakingEntries(
  decision: ChainDecision,
  nowMs: number
): boolean {
  const start = asNumber(decision.config["participationStart"]);
  const end = asNumber(decision.config["participationEnd"]);
  return start <= nowMs && (end === 0 || nowMs <= end);
}

/**
 * Throws a short message when the chain would refuse an entry or a
 * withdrawal in this decision now (P61 1.16 4.6 checks 2 and 4).
 */
export function assertDecisionOpen(decision: ChainDecision): void {
  if (decision.status !== "published") {
    throw new ChainOperationError(
      "rejected",
      "This decision isn't taking entries on the 6529 Network."
    );
  }
  if (decision.due) {
    throw new ChainOperationError(
      "rejected",
      "This decision is counting its result. Try again in a few minutes."
    );
  }
}

/**
 * A decision by its chain id or its 6529.io competition id (whose import's
 * id derives from it), checked against the answer.
 */
export async function getCheckedDecision(
  id: string,
  signal?: AbortSignal
): Promise<ChainDecision> {
  const chainId = chainIdOf(id, LegacyObjectKind.DECISION);
  const found =
    chainId === null ? null : await wavesGateway.getDecision(chainId, signal);
  if (chainId === null || found === null) {
    throw new ChainOperationError("rejected", NOT_ON_CHAIN);
  }
  if (lower(found.decisionId) !== chainId) {
    throw new ChainOperationError("draft_mismatch", OTHER_OBJECT);
  }
  return found;
}

/**
 * The `chain_id` 6529.io's API gives a competition or a wave, when it gives a
 * well-formed one. A decision made on the 6529 Network has no UUID to derive
 * its chain id from, so the API names it. Absent (before the API sends it)
 * or null, the id is derived as before.
 */
export function apiChainId(record: unknown): Hex | null {
  const value =
    typeof record === "object" && record !== null
      ? (record as { readonly chain_id?: unknown }).chain_id
      : undefined;
  return typeof value === "string" && isChainId(value)
    ? (lower(value) as Hex)
    : null;
}

const ZERO_ID = /^0x0{64}$/i;
/** Pages of an author's entries the entry limit's count reads, 500 each. */
const AUTHOR_ENTRY_PAGES = 10;
const AUTHOR_ENTRY_PAGE = 500;

/**
 * The decision's submit group, or null when everyone may enter. The
 * gateway's decision names it (`submitGroup`: a GroupRef, version 0
 * following the group's current version); ChainDecision doesn't type it.
 */
function submitGroupOf(
  decision: ChainDecision
): { readonly groupId: Hex; readonly version: number } | null {
  const group = (decision as unknown as { readonly submitGroup?: unknown })
    .submitGroup;
  if (typeof group !== "object" || group === null) {
    return null;
  }
  const { groupId, version } = group as {
    readonly groupId?: unknown;
    readonly version?: unknown;
  };
  if (
    typeof groupId !== "string" ||
    !isChainId(groupId) ||
    ZERO_ID.test(groupId)
  ) {
    return null;
  }
  return {
    groupId: lower(groupId) as Hex,
    version: typeof version === "number" ? version : 0,
  };
}

/** Whether the author is in the group, or null when the gateway can't say. */
async function isGroupMember(
  group: { readonly groupId: Hex; readonly version: number },
  author: Hex,
  signal?: AbortSignal
): Promise<boolean | null> {
  const answer = await chainGatewayGet<{
    readonly groupId?: string;
    readonly principalId?: string;
    readonly member?: unknown;
  } | null>(`/v1/groups/${group.groupId}/members/${lower(author)}`, {
    signal,
    query: { ...HEAD, version: group.version },
    nullOn404: true,
  });
  if (answer === null || typeof answer.member !== "boolean") {
    return null;
  }
  if (
    lower(answer.groupId ?? "") !== group.groupId ||
    lower(answer.principalId ?? "") !== lower(author)
  ) {
    throw new ChainOperationError("draft_mismatch", OTHER_OBJECT);
  }
  return answer.member;
}

/**
 * How many of the author's entries in the decision are in the running,
 * counted up to `atLeast`: the reads stop once that many are found.
 */
async function activeEntriesOf(
  author: Hex,
  decisionId: Hex,
  atLeast: number,
  signal?: AbortSignal
): Promise<number> {
  let count = 0;
  let after: string | undefined;
  for (let page = 0; page < AUTHOR_ENTRY_PAGES; page += 1) {
    const rows = await chainGatewayGet<readonly ChainEntry[]>(
      `/v1/entries/by-author/${lower(author)}`,
      { signal, query: { ...HEAD, limit: AUTHOR_ENTRY_PAGE, after } }
    );
    count += rows.filter(
      (entry) =>
        entry.status === "active" &&
        lower(entry.decisionId) === lower(decisionId) &&
        lower(entry.author) === lower(author)
    ).length;
    const last = rows.at(-1)?.entryId;
    if (
      count >= atLeast ||
      rows.length < AUTHOR_ENTRY_PAGE ||
      last === undefined ||
      lower(last) === after
    ) {
      return count;
    }
    after = lower(last);
  }
  return count;
}

/**
 * Throws a short message when the chain would refuse the author's entry in
 * this decision (P61 1.16 4.6 checks 6 and 7): the author isn't in its
 * submit group, or already has as many entries in the running as it allows.
 * The chain refuses those only once the entry is in a block, and takes the
 * fee, so they are read before anything is signed. A read the gateway
 * can't answer (404) leaves the check to the chain.
 */
export async function assertCanSubmit(
  decision: ChainDecision,
  author: Hex,
  signal?: AbortSignal
): Promise<void> {
  const group = submitGroupOf(decision);
  if (
    group !== null &&
    (await isGroupMember(group, author, signal)) === false
  ) {
    throw new ChainOperationError(
      "rejected",
      "You aren't in the group that can enter this decision."
    );
  }
  const limit = asNumber(decision.config["maxEntriesPerAuthor"]);
  if (
    limit > 0 &&
    (await activeEntriesOf(author, decision.decisionId, limit, signal)) >= limit
  ) {
    throw new ChainOperationError(
      "rejected",
      limit === 1
        ? "You already have an entry in this decision, the most it allows."
        : `You already have ${limit} entries in this decision, the most it allows.`
    );
  }
}

/** Throws unless the decision is in the wave 6529.io's `waveId` names. */
function assertDecisionInWave(decision: ChainDecision, waveId: string): void {
  const wave = chainIdOf(waveId, LegacyObjectKind.WAVE);
  if (wave !== null && lower(decision.waveId) !== wave) {
    throw new ChainOperationError(
      "rejected",
      "This decision isn't in this wave on the 6529 Network."
    );
  }
}

/**
 * The decision an entry goes to: the 6529.io competition's when the wave
 * shows one (by the `chain_id` 6529.io's API gives it, else by its id),
 * else the wave's one published decision (the one taking entries now, when
 * it has several). Either must be in `waveId`'s wave.
 */
export async function resolveEntryDecision(
  input: {
    readonly waveId: string;
    readonly competitionId: string | null;
    readonly competitionChainId?: Hex | null | undefined;
  },
  signal?: AbortSignal,
  nowMs: number = Date.now()
): Promise<ChainDecision> {
  if (input.competitionId !== null) {
    const decision = await getCheckedDecision(
      input.competitionChainId ?? input.competitionId,
      signal
    );
    assertDecisionInWave(decision, input.waveId);
    return decision;
  }
  const wave = await resolveWave(input.waveId, signal);
  const decisions = await entryGateway.getWaveDecisions(wave.waveId, signal);
  const published = decisions.filter(
    (decision) =>
      decision.status === "published" &&
      lower(decision.waveId) === lower(wave.waveId)
  );
  const open =
    published.length > 1
      ? published.filter((decision) => isTakingEntries(decision, nowMs))
      : published;
  const [only, ...rest] = open;
  if (only === undefined) {
    throw new ChainOperationError(
      "rejected",
      "This wave has no decision taking entries on the 6529 Network."
    );
  }
  if (rest.length > 0) {
    throw new ChainOperationError(
      "rejected",
      "This wave has more than one open decision. Submit from the decision's own page."
    );
  }
  return only;
}
