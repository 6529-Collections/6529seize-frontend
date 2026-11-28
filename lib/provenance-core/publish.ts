// Copied from 6529-Collections/6529-provenance-app src/publish.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import { isAddressEqual, size, type Address, type Hex, type PublicClient } from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { rc2GetReleaseAbi } from "./abi/legacy";
import {
  describeAction,
  encodeAction,
  recordProblem,
  releaseHeaderProblem,
  type Action,
  type RecordInput,
  type ReleaseInput,
} from "./actions";
import { maxTransactionGas } from "./config/chains";
import { chainMeasure } from "./dryrun";
import type { Eip1193Provider } from "./governance";
import { planRelease, PlanError, type CallLimits } from "./pack";
import { readBuild, releaseHasSealedBy } from "./registry";

/**
 * Publishing: openRelease, publish and sealRelease, sent by a publisher key (or the owner) as
 * ordinary transactions. The core plans and simulates the transactions and hands them to a sender;
 * how they reach the chain (a browser wallet, a phone wallet, 6529 Desktop, a script) is the
 * sender's business.
 */

/** What the sending wallet can carry. */
export interface SenderCapability extends CallLimits {
  /** openRelease calldata limit. */
  maxOpenReleaseBytes: number;
  /** False when the wallet refuses gas fields from the page and estimates gas itself. */
  setsGas: boolean;
}

/** A browser or phone wallet, or a script: 64 KiB and 100 records per publish call. */
export const STANDARD_SENDER: SenderCapability = {
  maxCalldataBytes: 64 * 1024,
  maxRecordsPerCall: 100,
  maxOpenReleaseBytes: 4 * 1024,
  setsGas: true,
};

/**
 * A browser wallet forwarded by 6529 Desktop: at most 10 KiB of calldata and 20 records per
 * publish call, and no gas, fee or nonce fields (the wallet estimates gas). Desktop reports its
 * calldata cap through wallet_getCapabilities; readSenderCapability reads it.
 */
export const DESKTOP_FORWARDED_SENDER: SenderCapability = {
  maxCalldataBytes: 10 * 1024,
  maxRecordsPerCall: 20,
  maxOpenReleaseBytes: 4 * 1024,
  setsGas: false,
};

/**
 * The sending wallet's limits. 6529 Desktop's forwarding connector answers wallet_getCapabilities
 * with {"0xaa36a7": {desktopForwarding: {maxTransactionDataBytes: 10240}}}; any other wallet, or a
 * wallet that does not support the method, is a standard sender.
 */
export async function readSenderCapability(
  provider: Eip1193Provider,
  chainId: number,
): Promise<SenderCapability> {
  let caps: unknown;
  try {
    caps = await provider.request({ method: "wallet_getCapabilities" });
  } catch {
    return STANDARD_SENDER;
  }
  const chain = (caps as Record<string, unknown> | null)?.[`0x${chainId.toString(16)}`] as
    { desktopForwarding?: { maxTransactionDataBytes?: unknown } } | undefined;
  const max = chain?.desktopForwarding?.maxTransactionDataBytes;
  if (typeof max !== "number" || !Number.isInteger(max) || max <= 0) return STANDARD_SENDER;
  return { ...DESKTOP_FORWARDED_SENDER, maxCalldataBytes: max };
}

export interface PublishTx {
  index: number;
  to: Address;
  data: Hex;
  value: 0n;
  action: Action;
  description: string;
  records: number;
  /** Gas used in the eth_simulateV1 run that sized this transaction. */
  simulatedGasUsed: bigint;
}

export interface PublishPlan {
  chainId: number;
  registry: Address;
  from: Address;
  /** The block every simulation of the plan ran on. */
  block: bigint;
  /** The gas limit each transaction was simulated with and must succeed at. */
  gasLimit: bigint;
  capability: SenderCapability;
  txs: PublishTx[];
}

export interface PlanPublishInput {
  client: PublicClient;
  chainId: number;
  registry: Address;
  from: Address;
  target: { kind: "open"; header: ReleaseInput } | { kind: "existing"; releaseId: number };
  records: readonly RecordInput[];
  seal: boolean;
  gasLimit: bigint;
  capability: SenderCapability;
  onProgress?: ((message: string) => void) | undefined;
}

/** Throws unless `from` is an authorized publisher key or the owner (rule REL-1). */
export async function checkPublisher(
  client: PublicClient,
  registry: Address,
  from: Address,
): Promise<"publisher" | "owner"> {
  const [isPublisher, owner] = await Promise.all([
    client.readContract({ address: registry, abi, functionName: "isPublisher", args: [from] }),
    client.readContract({ address: registry, abi, functionName: "owner" }),
  ]);
  if (isPublisher) return "publisher";
  if (isAddressEqual(owner as Address, from)) return "owner";
  throw new PlanError(
    `${from} is neither a publisher key nor the owner of ${registry}; the registry would revert with NotPublisher.`,
  );
}

/**
 * Splits a release into transactions for one sending account. Each publish call stays within the
 * sender's calldata and record limits, then within the gas limit, measured with eth_simulateV1
 * after the calls it depends on. Under Glamsterdam a transaction can fail at a limit above its gas
 * used, so a call fits only when it succeeds at the limit.
 */
export async function planPublish(p: PlanPublishInput): Promise<PublishPlan> {
  const chainId = await p.client.getChainId();
  if (chainId !== p.chainId)
    throw new PlanError(`The client is on chain ${chainId}; the plan is for chain ${p.chainId}.`);
  const cap = maxTransactionGas(p.chainId);
  if (cap !== undefined && p.gasLimit > cap)
    throw new PlanError(
      `Chain ${p.chainId} refuses a transaction with more than ${cap} gas; the limit is ${p.gasLimit}.`,
    );
  p.records.forEach((r, i) => {
    const problem = recordProblem(r);
    if (problem) throw new PlanError(`Record ${i + 1}: ${problem}`);
  });
  if (p.target.kind === "open") {
    const problem = releaseHeaderProblem(p.target.header);
    if (problem) throw new PlanError(`Release header: ${problem}`);
  }
  await checkPublisher(p.client, p.registry, p.from);
  // Every simulation of this plan runs on one base block, so a release or subject that changes
  // during planning cannot give a plan whose parts saw two states.
  const block = await p.client.getBlockNumber({ cacheTime: 0 });
  let releaseId: number;
  let recordsSoFar = 0;
  if (p.target.kind === "open") {
    const count = (await p.client.readContract({
      address: p.registry,
      abi,
      functionName: "releaseCount",
      blockNumber: block,
    })) as number;
    releaseId = count + 1;
    const bytes = size(encodeAction({ kind: "openRelease", header: p.target.header }));
    if (bytes > p.capability.maxOpenReleaseBytes) {
      throw new PlanError(
        `openRelease is ${bytes} bytes of calldata, over the sender's ${p.capability.maxOpenReleaseBytes}.`,
      );
    }
  } else {
    releaseId = p.target.releaseId;
    const withSealedBy = releaseHasSealedBy(await readBuild(p.client, p.registry, block));
    const release = (await p.client.readContract({
      address: p.registry,
      abi: withSealedBy ? abi : rc2GetReleaseAbi,
      functionName: "getRelease",
      args: [releaseId],
      blockNumber: block,
    })) as {
      firstSequence: number;
      isSealed: boolean;
    };
    if (release.isSealed) throw new PlanError(`Release ${releaseId} is sealed.`);
    const sequenceCount = (await p.client.readContract({
      address: p.registry,
      abi,
      functionName: "sequenceCount",
      blockNumber: block,
    })) as number;
    recordsSoFar = sequenceCount + 1 - release.firstSequence;
  }
  const packed = await planRelease(
    {
      target:
        p.target.kind === "open"
          ? { kind: "open", releaseId, header: p.target.header }
          : { kind: "existing", releaseId, recordsSoFar },
      records: p.records,
      seal: p.seal,
      budget: p.gasLimit,
      sender: "key",
      limits: p.capability,
      onProgress: p.onProgress,
    },
    chainMeasure(
      p.client,
      p.registry,
      { kind: "key", account: p.from },
      p.gasLimit,
      new Map([[releaseId, recordsSoFar]]),
      block,
    ),
  );
  return {
    chainId: p.chainId,
    registry: p.registry,
    from: p.from,
    block,
    gasLimit: p.gasLimit,
    capability: p.capability,
    txs: packed.map((t, index) => {
      const action = t.actions[0]!;
      return {
        index,
        to: p.registry,
        data: encodeAction(action),
        value: 0n,
        action,
        description: describeAction(action),
        records: t.records,
        simulatedGasUsed: t.gasUsed,
      };
    }),
  };
}

/** Sends one planned transaction and resolves when it is mined, with its hash. */
export interface PublishSender {
  readonly capability: SenderCapability;
  send(tx: PublishTx, plan: PublishPlan): Promise<Hex | undefined>;
}

export interface ReceiptWait {
  /** Time between eth_getTransactionReceipt polls. Default 2,000 ms. */
  pollMs?: number;
  /**
   * How long to wait for a receipt before throwing, counted from submission. Default 600,000 ms. It
   * holds while a receipt request is still outstanding: a provider that never answers does not
   * extend the wait.
   */
  timeoutMs?: number;
  /** Stops the wait; the send throws with the transaction hash. */
  signal?: AbortSignal;
  /**
   * Called with the hash as soon as the wallet returns it, before the receipt wait. Store it here:
   * if the wait then fails, the hash is the way to find what happened to the transaction.
   */
  onSubmitted?: (hash: Hex, tx: PublishTx) => void;
}

/** Thrown when a submitted transaction has no usable receipt; `hash` names it. */
export class ReceiptError extends Error {
  constructor(
    message: string,
    readonly hash: Hex,
    readonly txIndex: number,
  ) {
    super(message);
    this.name = "ReceiptError";
  }
}

// Resolves with the request's answer, or rejects when the deadline passes or the signal aborts,
// whichever comes first. The request itself cannot be cancelled through EIP-1193; it is abandoned.
function withDeadline<T>(
  request: Promise<T>,
  deadline: number,
  signal: AbortSignal | undefined,
  onLate: () => Error,
) {
  return new Promise<T>((resolve, reject) => {
    const ms = Math.max(0, deadline - Date.now());
    const timer = setTimeout(() => reject(onLate()), ms);
    const abort = () => {
      clearTimeout(timer);
      reject(onLate());
    };
    signal?.addEventListener("abort", abort, { once: true });
    request.then(
      (v) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        reject(e);
      },
    );
  });
}

/**
 * Sends through any EIP-1193 provider: an injected browser wallet, WalletConnect, or 6529
 * Desktop's forwarding. When the wallet takes gas fields, gas comes from eth_estimateGas just
 * before each send, after the previous transaction is mined, and is never capped at 2^24.
 * Each send waits for its receipt and throws on a reverted transaction. When no receipt comes
 * within the timeout, or the signal aborts, it throws with the hash: the transaction may still be
 * mined, dropped or replaced, so read the subjects' version counts before sending again; a
 * repeated publish reverts on `expectedVersion`.
 */
export function eip1193Sender(
  provider: Eip1193Provider,
  capability: SenderCapability = STANDARD_SENDER,
  wait: number | ReceiptWait = 2000,
): PublishSender {
  const w: ReceiptWait = typeof wait === "number" ? { pollMs: wait } : wait;
  const pollMs = w.pollMs ?? 2000;
  const timeoutMs = w.timeoutMs ?? 600_000;
  return {
    capability,
    async send(tx, plan) {
      const chain = Number(await provider.request({ method: "eth_chainId" }));
      if (chain !== plan.chainId)
        throw new Error(`The wallet is on chain ${chain}; the plan is for chain ${plan.chainId}.`);
      const base = { from: plan.from, to: tx.to, data: tx.data, value: "0x0" };
      const gas = capability.setsGas
        ? ((await provider.request({ method: "eth_estimateGas", params: [base] })) as Hex)
        : undefined;
      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [gas ? { ...base, gas } : base],
      })) as Hex;
      w.onSubmitted?.(hash, tx);
      const deadline = Date.now() + timeoutMs;
      const late = () =>
        w.signal?.aborted
          ? new ReceiptError(
              `Stopped waiting for transaction ${tx.index + 1} (${hash}); it may still be mined.`,
              hash,
              tx.index,
            )
          : new ReceiptError(
              `No receipt for transaction ${tx.index + 1} (${hash}) after ${timeoutMs / 1000} s; it may still be mined, dropped or replaced.`,
              hash,
              tx.index,
            );
      for (;;) {
        if (w.signal?.aborted || Date.now() > deadline) throw late();
        const receipt = (await withDeadline(
          provider.request({ method: "eth_getTransactionReceipt", params: [hash] }),
          deadline,
          w.signal,
          late,
        )) as { status: Hex } | null;
        if (receipt) {
          if (receipt.status !== "0x1")
            throw new ReceiptError(`Transaction ${tx.index + 1} (${hash}) reverted.`, hash, tx.index);
          return hash;
        }
        await withDeadline(new Promise((r) => setTimeout(r, pollMs)), deadline, w.signal, late);
      }
    },
  };
}

/**
 * A sender built from a function, for a UI layer that already has one, such as wagmi's
 * sendTransaction plus waitForTransactionReceipt.
 */
export function callbackSender(
  capability: SenderCapability,
  send: (tx: { to: Address; data: Hex; value: 0n }, plan: PublishPlan, index: number) => Promise<Hex>,
): PublishSender {
  return { capability, send: (tx, plan) => send({ to: tx.to, data: tx.data, value: 0n }, plan, tx.index) };
}

export interface ScriptExport {
  chainId: number;
  registry: Address;
  from: Address;
  gasLimit: string;
  note: string;
  transactions: {
    index: number;
    to: Address;
    value: "0";
    data: Hex;
    description: string;
    records: number;
    simulatedGasUsed: string;
  }[];
}

/**
 * The plan as JSON for a script to send, in order, from `from`: calldata and simulated gas per
 * transaction. A script estimates gas again before each send, since each transaction depends on
 * the state the previous one leaves.
 */
export function exportForScript(plan: PublishPlan): ScriptExport {
  return {
    chainId: plan.chainId,
    registry: plan.registry,
    from: plan.from,
    gasLimit: plan.gasLimit.toString(),
    note: "Send in order from `from`, waiting for each receipt. Estimate gas before each send; simulatedGasUsed is from eth_simulateV1 at planning time.",
    transactions: plan.txs.map((t) => ({
      index: t.index,
      to: t.to,
      value: "0",
      data: t.data,
      description: t.description,
      records: t.records,
      simulatedGasUsed: t.simulatedGasUsed.toString(),
    })),
  };
}

/** A sender that sends nothing and collects the transactions, for exportForScript-style output. */
export function collectingSender(
  capability: SenderCapability = STANDARD_SENDER,
): PublishSender & { collected: PublishTx[] } {
  const collected: PublishTx[] = [];
  return {
    capability,
    collected,
    async send(tx) {
      collected.push(tx);
      return undefined;
    },
  };
}

/**
 * Why a planned transaction does not fit a sender's limits, or undefined when it does. The limits
 * apply to the transaction's own calldata: openRelease against `maxOpenReleaseBytes`, every call
 * against `maxCalldataBytes`, and a publish call's records against `maxRecordsPerCall`.
 */
export function senderLimitProblem(tx: PublishTx, c: SenderCapability): string | undefined {
  const bytes = size(tx.data);
  if (tx.action.kind === "openRelease" && bytes > c.maxOpenReleaseBytes)
    return `openRelease is ${bytes} bytes of calldata, over the sender's ${c.maxOpenReleaseBytes}.`;
  if (bytes > c.maxCalldataBytes)
    return `${tx.description} is ${bytes} bytes of calldata, over the sender's ${c.maxCalldataBytes}.`;
  if (tx.action.kind === "publish" && tx.action.records.length > c.maxRecordsPerCall)
    return `${tx.description} holds ${tx.action.records.length} records, over the sender's ${c.maxRecordsPerCall}.`;
  return undefined;
}

/**
 * Sends a plan in order and stops at the first failure. Before sending anything it checks every
 * transaction's calldata against the sender's limits, and that each transaction's calldata is the
 * encoding of its action, so a plan edited after planning is refused.
 */
export async function sendPlan(
  plan: PublishPlan,
  sender: PublishSender,
  onSent?: (tx: PublishTx, hash: Hex | undefined) => void,
): Promise<(Hex | undefined)[]> {
  for (const tx of plan.txs) {
    if (encodeAction(tx.action).toLowerCase() !== tx.data.toLowerCase())
      throw new Error(`Transaction ${tx.index + 1}: its calldata is not the encoding of its action.`);
    const problem = senderLimitProblem(tx, sender.capability);
    if (problem) throw new Error(`Transaction ${tx.index + 1}: ${problem} Plan again for this sender.`);
  }
  const hashes: (Hex | undefined)[] = [];
  for (const tx of plan.txs) {
    const h = await sender.send(tx, plan);
    hashes.push(h);
    onSent?.(tx, h);
  }
  return hashes;
}
