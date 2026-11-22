// Copied from 6529-Collections/6529-provenance-app src/simulate.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import {
  decodeErrorResult,
  hexToBigInt,
  numberToHex,
  pad,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
} from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { describeAction, encodeAction, toCall, type Action } from "./actions";
import {
  approvedHashSignatures,
  encodeExecTransaction,
  SAFE_THRESHOLD_SLOT,
  safeAbi,
  safeTxFor,
  safeTxHash,
  type SafeTx,
} from "./safe";

/** Who sends the transactions of a plan. */
export type Actor =
  | { kind: "safe"; safe: Address; owners: readonly Address[]; nonce: bigint; chainId: number }
  | { kind: "key"; account: Address };

/** One transaction of a plan: the Safe sends all its actions in one execTransaction; a key sends one action. */
export interface PlannedTx {
  actions: Action[];
}

export interface SimCall {
  from: Address;
  to: Address;
  data: Hex;
  /** The transaction's gas limit. Under Glamsterdam a transaction can need a limit well above its gas used. */
  gas?: bigint;
}

export interface SimResult {
  ok: boolean;
  gasUsed: bigint;
  logs: Log[];
  returnData: Hex;
  error?: string;
}

export interface TxSimulation {
  index: number;
  ok: boolean;
  gasUsed: bigint;
  events: { name: string; args: Record<string, unknown> }[];
  error?: string;
  /** For a failed Safe transaction, the action that reverted when the calls ran one by one. */
  failedAction?: { index: number; description: string; error: string };
  safeTx?: SafeTx;
  safeTxHash?: Hex;
}

export interface PlanSimulation {
  method: "eth_simulateV1";
  block: bigint;
  gasLimit?: bigint;
  txs: TxSimulation[];
}

interface RpcCallResult {
  status: Hex;
  gasUsed: Hex;
  returnData: Hex;
  logs: Log[];
  error?: { code: number; message: string; data?: Hex };
}

const RETRYABLE =
  /block not found|header not found|timeout|429|rate limit|ECONNRESET|fetch failed|502|503|504/i;

/** The public Sepolia endpoint sometimes answers "block not found" from a lagging server; retry those. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 4, delayMs = 800): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!RETRYABLE.test(String((e as Error)?.message ?? e)) || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}

/**
 * Runs calls in order with eth_simulateV1, one block per call so that each may use up to a
 * block's gas, with state carried from each call to the next. Validation is off, so `from` can
 * be any address, including a contract.
 */
export async function simulateSequence(
  client: PublicClient,
  calls: readonly SimCall[],
  stateOverrides?: Record<Address, { stateDiff?: Record<Hex, Hex>; code?: Hex }>,
  blockTag: bigint | "latest" = "latest",
): Promise<{ block: bigint; results: SimResult[] }> {
  const block = blockTag === "latest" ? await withRetry(() => client.getBlockNumber()) : blockTag;
  const blockStateCalls = calls.map((c, i) => ({
    ...(i === 0 && stateOverrides ? { stateOverrides } : {}),
    calls: [{ from: c.from, to: c.to, data: c.data, ...(c.gas ? { gas: numberToHex(c.gas) } : {}) }],
  }));
  const raw = (await withRetry(() =>
    client.request({
      method: "eth_simulateV1" as never,
      params: [{ blockStateCalls, validation: false, traceTransfers: false }, numberToHex(block)] as never,
    }),
  )) as { calls: RpcCallResult[] }[];
  const results = raw.map((b) => {
    const c = b.calls[0]!;
    return {
      ok: c.status === "0x1",
      gasUsed: hexToBigInt(c.gasUsed),
      logs: c.logs ?? [],
      returnData: c.returnData,
      error: c.status === "0x1" ? undefined : decodeRevert(c.error?.data ?? c.returnData, c.error?.message),
    };
  });
  return { block, results };
}

/** Names a revert: a registry error with its arguments, a Safe GS code, or the node's message. */
export function decodeRevert(data: Hex | undefined, fallback?: string): string {
  if (data && data !== "0x") {
    try {
      const d = decodeErrorResult({ abi, data });
      const args = (d.args ?? []).map((a) => (typeof a === "bigint" ? a.toString() : String(a)));
      return `${d.errorName}(${args.join(", ")})`;
    } catch {
      try {
        const d = decodeErrorResult({
          abi: [{ type: "error", name: "Error", inputs: [{ type: "string", name: "message" }] }],
          data,
        });
        const msg = String(d.args?.[0]);
        return SAFE_ERRORS[msg] ? `${msg}: ${SAFE_ERRORS[msg]}` : msg;
      } catch {
        return `revert data ${data.slice(0, 74)}${data.length > 74 ? "…" : ""}`;
      }
    }
  }
  return fallback ?? "reverted without data";
}

const SAFE_ERRORS: Record<string, string> = {
  GS010: "not enough gas to execute the Safe transaction",
  GS013: "a call in the Safe transaction reverted",
  GS020: "signatures data too short",
  GS025: "hash not approved by an owner",
  GS026: "invalid owner, or owners not sorted",
};

function decodeEvents(logs: Log[]) {
  const reg = parseEventLogs({ abi, logs, strict: false });
  const safe = parseEventLogs({ abi: safeAbi, logs, strict: false });
  return [...reg, ...safe].map((e) => ({
    name: e.eventName as string,
    args: (e.args ?? {}) as Record<string, unknown>,
  }));
}

/** The eth_simulateV1 calls that execute a plan as the actor would. */
export function planCalls(registry: Address, actor: Actor, plan: readonly PlannedTx[], gas?: bigint) {
  if (actor.kind === "key") {
    return {
      calls: plan.map((t): SimCall => {
        if (t.actions.length !== 1) throw new Error("A publisher key sends one action per transaction.");
        return { from: actor.account, to: registry, data: encodeAction(t.actions[0]!), gas };
      }),
      safeTxs: [] as SafeTx[],
      overrides: undefined,
    };
  }
  const owner = actor.owners[0];
  if (!owner) throw new Error("The Safe has no owners to simulate with.");
  const safeTxs = plan.map((t, i) =>
    safeTxFor(
      t.actions.map((a) => toCall(registry, a)),
      actor.nonce + BigInt(i),
    ),
  );
  const signatures = approvedHashSignatures([owner]);
  return {
    calls: safeTxs.map(
      (tx): SimCall => ({ from: owner, to: actor.safe, data: encodeExecTransaction(tx, signatures), gas }),
    ),
    safeTxs,
    // Threshold 1, so one owner's approval (msg.sender, v = 1) satisfies execTransaction.
    overrides: {
      [actor.safe]: { stateDiff: { [SAFE_THRESHOLD_SLOT]: pad("0x01", { size: 32 }) } },
    } as Record<Address, { stateDiff: Record<Hex, Hex> }>,
  };
}

/**
 * The dry run. For a Safe it runs the real execTransaction of each planned transaction, in
 * order, from the first owner with the Safe's threshold overridden to 1 in the simulation only.
 * Gas therefore includes the Safe's own cost. Each transaction runs with `gasLimit`, the limit it
 * will be sent with, because under Glamsterdam the limit has to cover state gas as well and a
 * transaction can fail at a limit above its gas used. When a Safe transaction fails, the plan up to
 * it runs again with each action called directly from the Safe, to name the action that reverted.
 */
export async function simulatePlan(
  client: PublicClient,
  registry: Address,
  actor: Actor,
  plan: readonly PlannedTx[],
  gasLimit?: bigint,
): Promise<PlanSimulation> {
  const { calls, safeTxs, overrides } = planCalls(registry, actor, plan, gasLimit);
  const { block, results } = await simulateSequence(client, calls, overrides);
  const txs: TxSimulation[] = results.map((r, i) => ({
    index: i,
    ok: r.ok,
    gasUsed: r.gasUsed,
    events: decodeEvents(r.logs),
    error: r.error,
    safeTx: safeTxs[i],
    safeTxHash:
      actor.kind === "safe" && safeTxs[i] ? safeTxHash(actor.chainId, actor.safe, safeTxs[i]) : undefined,
  }));
  const firstFail = txs.findIndex((t) => !t.ok);
  if (firstFail !== -1 && actor.kind === "safe") {
    const prior = plan.slice(0, firstFail).flatMap((t) => t.actions);
    const failing = plan[firstFail]!.actions;
    const direct = [...prior, ...failing].map(
      (a): SimCall => ({ from: actor.safe, to: registry, data: encodeAction(a), gas: gasLimit }),
    );
    try {
      const diag = await simulateSequence(client, direct, undefined, block);
      const k = diag.results.slice(prior.length).findIndex((r) => !r.ok);
      if (k !== -1) {
        txs[firstFail]!.failedAction = {
          index: k,
          description: describeAction(failing[k]!),
          error: diag.results[prior.length + k]!.error ?? "reverted",
        };
      }
    } catch {
      // The diagnosis is extra detail; the failed simulation above stands without it.
    }
  }
  return { method: "eth_simulateV1", block, gasLimit, txs };
}

/**
 * eth_estimateGas for the first planned transaction against current state. Later transactions
 * depend on the state the earlier ones leave, which eth_estimateGas cannot carry, so the dry run
 * gives their gas from the simulation.
 */
export async function estimateFirst(
  client: PublicClient,
  registry: Address,
  actor: Actor,
  plan: readonly PlannedTx[],
): Promise<bigint> {
  const { calls, overrides } = planCalls(registry, actor, plan.slice(0, 1));
  const c = calls[0]!;
  const params: unknown[] = [{ from: c.from, to: c.to, data: c.data }, "latest"];
  if (overrides) params.push(overrides);
  const res = await withRetry(() =>
    client.request({ method: "eth_estimateGas" as never, params: params as never }),
  );
  return hexToBigInt(res as Hex);
}
