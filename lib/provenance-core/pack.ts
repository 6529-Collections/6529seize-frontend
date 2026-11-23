// Copied from 6529-Collections/6529-provenance-app src/pack.ts at commit 171ab352f90bb56f3e2248d4fd5b8e69b2a39092.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { size } from "viem";
import { encodeAction, type Action, type RecordInput, type ReleaseInput } from "./actions";
import type { PlannedTx } from "./simulate";

export interface Measured {
  ok: boolean;
  gasUsed: bigint;
  error?: string | undefined;
}

/**
 * Runs `candidate` after `prefix`, on the chain, with the budget as its gas limit. In the app it
 * is an eth_simulateV1 run of the whole prefix plus the candidate; the tests pass a model. A
 * candidate fits when it succeeds at that limit: under Glamsterdam a transaction can fail at a
 * limit above its gas used, because the limit also funds state gas.
 */
export type Measure = (prefix: readonly PlannedTx[], candidate: PlannedTx) => Promise<Measured>;

export type ReleaseTarget =
  | { kind: "open"; releaseId: number; header: ReleaseInput }
  | { kind: "existing"; releaseId: number; recordsSoFar: number };

export interface ReleasePlanInput {
  target: ReleaseTarget;
  /** Calls that go first in the first transaction, such as registrations. Owner only. */
  preActions?: readonly Action[];
  records: readonly RecordInput[];
  seal: boolean;
  /** Gas limit each transaction is simulated and sent with. */
  budget: bigint;
  /** "safe" packs every call of a transaction into one execTransaction; "key" sends one call per transaction. */
  sender: "safe" | "key";
  /** Starting guess of gas per record; the planner corrects it from each measurement. */
  perRecordGuess?: bigint;
  onProgress?: ((message: string) => void) | undefined;
  /**
   * Limits of the sending wallet, applied to each publish call before gas is measured: calldata
   * bytes and records per call. 6529 Desktop's forwarded browser wallets carry at most 10 KiB of
   * calldata, about 15 records.
   */
  limits?: CallLimits;
}

export interface CallLimits {
  maxCalldataBytes: number;
  maxRecordsPerCall: number;
}

/** The most records from `start` whose publish call stays within the limits. */
export function maxRecordsWithin(
  releaseId: number,
  records: readonly RecordInput[],
  start: number,
  limits: CallLimits,
): number {
  const fits = (n: number) =>
    size(encodeAction({ kind: "publish", releaseId, records: records.slice(start, start + n) })) <=
    limits.maxCalldataBytes;
  let lo = 0;
  let hi = Math.min(records.length - start, limits.maxRecordsPerCall);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface PackedTx extends PlannedTx {
  gasUsed: bigint;
  records: number;
}

export class PlanError extends Error {}

const MAX_TRIES_PER_TX = 8;

/**
 * Splits a release into transactions that each stay under the gas budget, measuring every
 * candidate on the chain. Records keep their order, so a subject's versions stay in sequence. The
 * first transaction carries openRelease and the pre-actions; the last carries sealRelease.
 *
 * Gas per record is not constant (labels, CIDs and new subjects cost more), so the planner
 * guesses a count from the gas per record measured so far, measures it, and narrows between
 * the largest count that fit and the smallest that did not. It accepts a count once it uses
 * 90% of the budget, the two bounds meet, or it has measured 8 candidates.
 */
export async function planRelease(input: ReleasePlanInput, measure: Measure): Promise<PackedTx[]> {
  const { target, records, budget, sender } = input;
  const releaseId = target.releaseId;
  const sealCount = (target.kind === "existing" ? target.recordsSoFar : 0) + records.length;
  const opener: Action[] = target.kind === "open" ? [{ kind: "openRelease", header: target.header }] : [];
  const pre: Action[] = [...opener, ...(input.preActions ?? [])];
  const sealAction: Action = { kind: "sealRelease", releaseId, expectedRecordCount: sealCount };
  const out: PackedTx[] = [];
  const prefix = () => out.map((t) => ({ actions: t.actions }));

  const accept = async (actions: Action[], n: number) => {
    const r = await measure(prefix(), { actions });
    if (!r.ok)
      throw new PlanError(
        `Simulation failed for "${actions.map((a) => a.kind).join(", ")}": ${r.error ?? "reverted"}`,
      );
    if (r.gasUsed > budget)
      throw new PlanError(`A transaction needs ${r.gasUsed} gas, over the ${budget} budget.`);
    out.push({ actions, gasUsed: r.gasUsed, records: n });
  };

  if (sender === "key") {
    // A key sends each call alone; only the publish calls are packed.
    for (const a of pre) await accept([a], 0);
  }

  let perRecord = input.perRecordGuess ?? 1_000_000n;
  let i = 0;
  while (i < records.length) {
    const fixed = sender === "safe" && out.length === 0 ? pre : [];
    const remaining = input.limits
      ? maxRecordsWithin(releaseId, records, i, input.limits)
      : records.length - i;
    if (remaining === 0)
      throw new PlanError(
        `Record ${i + 1} alone is over ${input.limits!.maxCalldataBytes} bytes of calldata.`,
      );
    const build = (count: number): Action[] => {
      const actions: Action[] = [
        ...fixed,
        { kind: "publish", releaseId, records: records.slice(i, i + count) },
      ];
      if (sender === "safe" && input.seal && i + count === records.length) actions.push(sealAction);
      return actions;
    };

    let fit = 0;
    let fitGas = 0n;
    let over = remaining + 1;
    let count = clamp(Number(budget / (perRecord > 0n ? perRecord : 1n)), 1, remaining);
    for (let tries = 0; tries < MAX_TRIES_PER_TX; tries++) {
      input.onProgress?.(`Transaction ${out.length + 1}: measuring ${count} records`);
      const r = await measure(prefix(), { actions: build(count) });
      if (r.ok && r.gasUsed <= budget) {
        fit = count;
        fitGas = r.gasUsed;
        if (count >= 2) perRecord = r.gasUsed / BigInt(count);
      } else {
        if (!r.ok && count === 1) {
          throw new PlanError(`Record ${i + 1} fails in simulation: ${r.error ?? "reverted"}`);
        }
        over = Math.min(over, count);
        if (r.ok && count >= 2) perRecord = r.gasUsed / BigInt(count);
      }
      if (fit === remaining || over - fit <= 1 || (fit > 0 && fitGas * 10n >= budget * 9n)) break;
      // Next guess from the measured rate, kept strictly between the bounds.
      const guess = Number((budget * 97n) / 100n / (perRecord > 0n ? perRecord : 1n));
      count = clamp(guess, fit + 1, over - 1);
      if (fit > 0 && guess <= fit) count = fit + Math.max(1, Math.floor((over - fit) / 2));
      if (!r.ok) count = clamp(Math.floor((fit + over) / 2), fit + 1, over - 1);
      count = clamp(count, fit + 1, over - 1);
    }
    if (fit === 0) throw new PlanError(`Record ${i + 1} alone does not fit in ${budget} gas.`);
    out.push({ actions: build(fit), gasUsed: fitGas, records: fit });
    i += fit;
  }

  if (records.length === 0 && sender === "safe") {
    const actions = [...pre, ...(input.seal ? [sealAction] : [])];
    if (actions.length) await accept(actions, 0);
  } else if (sender === "key" && input.seal) {
    await accept([sealAction], 0);
  }
  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

/** Splits a plain list of owner actions (no release) into Safe transactions under the budget, in order. */
export async function planActions(
  actions: readonly Action[],
  budget: bigint,
  measure: Measure,
): Promise<PackedTx[]> {
  const out: PackedTx[] = [];
  let current: Action[] = [];
  let currentGas = 0n;
  for (const a of actions) {
    const prefix = out.map((t) => ({ actions: t.actions }));
    const r = await measure(prefix, { actions: [...current, a] });
    if (r.ok && r.gasUsed <= budget) {
      current = [...current, a];
      currentGas = r.gasUsed;
      continue;
    }
    if (current.length === 0) {
      throw new PlanError(
        r.ok
          ? `One call needs ${r.gasUsed} gas, over the budget.`
          : `Simulation failed: ${r.error ?? "reverted"}`,
      );
    }
    out.push({ actions: current, gasUsed: currentGas, records: 0 });
    const alone = await measure([...prefix, { actions: current }], { actions: [a] });
    if (!alone.ok) throw new PlanError(`Simulation failed: ${alone.error ?? "reverted"}`);
    if (alone.gasUsed > budget) throw new PlanError(`One call needs ${alone.gasUsed} gas, over the budget.`);
    current = [a];
    currentGas = alone.gasUsed;
  }
  if (current.length) out.push({ actions: current, gasUsed: currentGas, records: 0 });
  return out;
}
