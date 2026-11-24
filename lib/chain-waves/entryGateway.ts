import type { Hex } from "viem";
import { chainGatewayGet } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { wavesGateway, type ChainDecision } from "./gateway";
import { chainIdOf, LegacyObjectKind, resolveWave } from "./ids";

/**
 * The reads an entry needs beyond gateway.ts (WAVES-API "Decisions"): a
 * decision by its chain id or its 6529.io competition id, and a wave's
 * decisions. At the head, as every write's reads are. An imported object's
 * chain id is derived here (ids.ts), and every answer an entry or a
 * withdrawal builds on must name the id asked for, so a gateway can't point
 * a signature at another object.
 */

const HEAD = { at: "head" } as const;
const lower = (value: string): string => value.toLowerCase();
const WAVE_DECISIONS_LIMIT = 100;

export const entryGateway = {
  /** A wave's decisions, every status. */
  getWaveDecisions: (waveId: Hex, signal?: AbortSignal) =>
    chainGatewayGet<readonly ChainDecision[]>(
      `/v1/waves/${lower(waveId)}/decisions`,
      { signal, query: { ...HEAD, limit: WAVE_DECISIONS_LIMIT } }
    ),
};

const NOT_ON_CHAIN = "This decision isn't on the 6529 Network.";
const OTHER_OBJECT =
  "The 6529 Network gateway answered for a different object. Nothing was signed.";

const asMs = (value: unknown): number => {
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
  const start = asMs(decision.config["participationStart"]);
  const end = asMs(decision.config["participationEnd"]);
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
 * shows one, else the wave's one published decision (the one taking
 * entries now, when it has several). Either must be in `waveId`'s wave.
 */
export async function resolveEntryDecision(
  input: { readonly waveId: string; readonly competitionId: string | null },
  signal?: AbortSignal,
  nowMs: number = Date.now()
): Promise<ChainDecision> {
  if (input.competitionId !== null) {
    const decision = await getCheckedDecision(input.competitionId, signal);
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
