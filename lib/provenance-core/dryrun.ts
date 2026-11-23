// Copied from 6529-Collections/6529-provenance-app src/dryrun.ts at commit 8496bfbb6347c265ec74c7e361612d97ccdaf731.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import type { Address, PublicClient } from "viem";
import type { Action } from "./actions";
import type { Measure } from "./pack";
import { safeTxHash } from "./safe";
import { planCalls, simulatePlan, type Actor, type PlannedTx, type TxSimulation } from "./simulate";

/**
 * The calls a candidate transaction depends on, without the publish calls it does not.
 *
 * Simulating transaction k after all k - 1 before it costs the gas of all of them in one
 * eth_simulateV1 request, and some public endpoints cap a request at 50 million gas in total.
 * Publish calls depend on each other only through their subjects (expectedVersion, record type,
 * the unchanged-record rule), so the prefix keeps every call that is not a publish, and from the
 * publish calls only the records of subjects the candidate touches.
 *
 * One rule depends on every record: sealRelease checks the release's record count. In a compact
 * run the seal's expected count is replaced with the count that run produces; the plan's own
 * count comes from countRecords and is checked again by the in-sequence run when it fits.
 */
export function compactPrefix(
  prefix: readonly PlannedTx[],
  candidate: PlannedTx,
): { prefix: PlannedTx[]; candidate: PlannedTx } {
  const touched = new Set<string>();
  for (const a of candidate.actions) {
    if (a.kind === "publish") for (const r of a.records) touched.add(r.subjectId.toLowerCase());
    if (a.kind === "deleteVersion" || a.kind === "deleteVersions" || a.kind === "deleteSubject")
      touched.add(a.subjectId.toLowerCase());
  }
  const kept: Action[] = [];
  const perRelease = new Map<number, number>();
  for (const t of prefix) {
    for (const a of t.actions) {
      if (a.kind !== "publish") {
        kept.push(a);
        continue;
      }
      const records = a.records.filter((r) => touched.has(r.subjectId.toLowerCase()));
      if (records.length) {
        kept.push({ ...a, records });
        perRelease.set(a.releaseId, (perRelease.get(a.releaseId) ?? 0) + records.length);
      }
    }
  }
  const fixSeal = (a: Action, extra = 0): Action => {
    if (a.kind !== "sealRelease") return a;
    return { ...a, expectedRecordCount: (perRelease.get(a.releaseId) ?? 0) + extra };
  };
  const prefixActions = kept.map((a) => fixSeal(a));
  let candidateCount = 0;
  const actions = candidate.actions.map((a) => {
    if (a.kind === "publish") {
      candidateCount += a.records.length;
      return a;
    }
    return a.kind === "sealRelease" ? fixSeal(a, candidateCount) : a;
  });
  return { prefix: prefixActions.length ? [{ actions: prefixActions }] : [], candidate: { actions } };
}

/**
 * Whether a release opened by this plan is sealed with a count that differs from the records the
 * plan publishes to it. The compact dry run cannot see this, so the app checks it directly.
 */
export function sealCountProblems(
  plan: readonly PlannedTx[],
  recordsSoFar: Map<number, number> = new Map(),
): string[] {
  const counts = new Map(recordsSoFar);
  const problems: string[] = [];
  for (const t of plan) {
    for (const a of t.actions) {
      if (a.kind === "publish") counts.set(a.releaseId, (counts.get(a.releaseId) ?? 0) + a.records.length);
      if (a.kind === "sealRelease" && (counts.get(a.releaseId) ?? 0) !== a.expectedRecordCount) {
        problems.push(
          `sealRelease(${a.releaseId}, ${a.expectedRecordCount}) but the release holds ${counts.get(a.releaseId) ?? 0} records at that point.`,
        );
      }
    }
  }
  return problems;
}

/** The planner's measure: the candidate after its compact prefix, at the budget as gas limit. */
export function chainMeasure(
  client: PublicClient,
  registry: Address,
  actor: Actor,
  gasLimit: bigint,
): Measure {
  return async (prefix, candidate) => {
    const c = compactPrefix(prefix, candidate);
    const sim = await simulatePlan(client, registry, actor, [...c.prefix, c.candidate], gasLimit);
    const last = sim.txs.at(-1)!;
    const firstFail = sim.txs.find((t) => !t.ok);
    if (firstFail && firstFail !== last) {
      return {
        ok: false,
        gasUsed: 0n,
        error: `a call it depends on failed: ${firstFail.failedAction?.error ?? firstFail.error}`,
      };
    }
    return {
      ok: last.ok,
      gasUsed: last.gasUsed,
      error: last.failedAction ? `${last.failedAction.description}: ${last.failedAction.error}` : last.error,
    };
  };
}

export interface DryRunTx extends TxSimulation {
  /** "compact": simulated after its compact prefix. */
  mode: "compact";
}

export interface DryRun {
  block: bigint;
  gasLimit: bigint;
  txs: DryRunTx[];
  /** The whole plan run in one request, in order. Undefined when it was not attempted. */
  sequence?:
    | {
        ok: boolean;
        stoppedAt?: number | undefined;
        cumulativeGas: bigint;
        error?: string | undefined;
        likelyCapped: boolean;
      }
    | undefined;
  sealProblems: string[];
}

/** Sum of gas used above which a failed in-sequence run is reported as possibly capped by the endpoint. */
export const ENDPOINT_CAP_HINT = 45_000_000n;

/**
 * The dry run shown before anything is proposed: every transaction after its compact prefix,
 * then the whole plan in sequence. The per-transaction results decide; the sequence run adds a
 * check of the order and of rules the compact run cannot see.
 */
export async function dryRun(
  client: PublicClient,
  registry: Address,
  actor: Actor,
  plan: readonly PlannedTx[],
  gasLimit: bigint,
  recordsSoFar?: Map<number, number>,
  onProgress?: (message: string) => void,
): Promise<DryRun> {
  const txs: DryRunTx[] = [];
  let block = 0n;
  for (let k = 0; k < plan.length; k++) {
    onProgress?.(`Simulating transaction ${k + 1} of ${plan.length}`);
    const c = compactPrefix(plan.slice(0, k), plan[k]!);
    // The approved-hash signature does not cover the nonce, so the compact run's nonces do not
    // change the result; the real ones are filled in below.
    const sim = await simulatePlan(client, registry, actor, [...c.prefix, c.candidate], gasLimit);
    block = sim.block;
    const last = sim.txs.at(-1)!;
    const prefixFail = sim.txs.slice(0, -1).find((t) => !t.ok);
    txs.push({
      ...last,
      index: k,
      mode: "compact",
      ...(prefixFail
        ? {
            ok: false,
            error: `a call it depends on failed: ${prefixFail.failedAction?.error ?? prefixFail.error}`,
          }
        : {}),
    });
  }
  // The displayed Safe transactions carry the real nonces and the plan's own seal counts.
  if (actor.kind === "safe") {
    const full = planCalls(registry, actor, plan, gasLimit);
    txs.forEach((t, k) => {
      t.safeTx = full.safeTxs[k];
      t.safeTxHash = full.safeTxs[k] ? safeTxHash(actor.chainId, actor.safe, full.safeTxs[k]) : undefined;
    });
  }

  let sequence: DryRun["sequence"];
  if (plan.length > 1) {
    onProgress?.("Simulating the whole plan in sequence");
    try {
      const sim = await simulatePlan(client, registry, actor, plan, gasLimit);
      const stop = sim.txs.findIndex((t) => !t.ok);
      const upTo = stop === -1 ? sim.txs : sim.txs.slice(0, stop + 1);
      const cumulativeGas = upTo.reduce((g, t) => g + t.gasUsed, 0n);
      sequence = {
        ok: stop === -1,
        stoppedAt: stop === -1 ? undefined : stop,
        cumulativeGas,
        error: stop === -1 ? undefined : (sim.txs[stop]!.failedAction?.error ?? sim.txs[stop]!.error),
        likelyCapped: stop !== -1 && cumulativeGas >= ENDPOINT_CAP_HINT && txs.every((t) => t.ok),
      };
    } catch (e) {
      const err = e as { details?: string; shortMessage?: string; message?: string };
      const msg = err.details ?? err.shortMessage ?? err.message ?? String(e);
      sequence = {
        ok: false,
        cumulativeGas: 0n,
        error: msg.split("\n")[0],
        likelyCapped: /intrinsic gas too low|gas cap|exceeds/i.test(msg),
      };
    }
  }
  return { block, gasLimit, txs, sequence, sealProblems: sealCountProblems(plan, recordsSoFar) };
}
