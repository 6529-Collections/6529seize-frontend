// Copied from 6529-Collections/6529-provenance-app src/publish.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { isAddressEqual, size, type Address, type Hex, type PublicClient } from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { describeAction, encodeAction, type Action, type RecordInput, type ReleaseInput } from "./actions";
import { chainMeasure } from "./dryrun";
import type { Eip1193Provider } from "./governance";
import { planRelease, PlanError, type CallLimits } from "./pack";

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

/** A browser wallet forwarded by 6529 Desktop: 10 KiB of calldata (about 15 records), no gas fields. */
export const DESKTOP_FORWARDED_SENDER: SenderCapability = {
  maxCalldataBytes: 10 * 1024,
  maxRecordsPerCall: 100,
  maxOpenReleaseBytes: 4 * 1024,
  setsGas: false,
};

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
  onProgress?: (message: string) => void;
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
  await checkPublisher(p.client, p.registry, p.from);
  let releaseId: number;
  let recordsSoFar = 0;
  if (p.target.kind === "open") {
    const count = (await p.client.readContract({
      address: p.registry,
      abi,
      functionName: "releaseCount",
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
    const release = (await p.client.readContract({
      address: p.registry,
      abi,
      functionName: "getRelease",
      args: [releaseId],
    })) as {
      firstSequence: number;
      isSealed: boolean;
    };
    if (release.isSealed) throw new PlanError(`Release ${releaseId} is sealed.`);
    const sequenceCount = (await p.client.readContract({
      address: p.registry,
      abi,
      functionName: "sequenceCount",
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
    chainMeasure(p.client, p.registry, { kind: "key", account: p.from }, p.gasLimit),
  );
  return {
    chainId: p.chainId,
    registry: p.registry,
    from: p.from,
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

/**
 * Sends through any EIP-1193 provider: an injected browser wallet, WalletConnect, or 6529
 * Desktop's forwarding. When the wallet takes gas fields, gas comes from eth_estimateGas just
 * before each send, after the previous transaction is mined, and is never capped at 2^24.
 * Each send waits for its receipt and throws on a reverted transaction.
 */
export function eip1193Sender(
  provider: Eip1193Provider,
  capability: SenderCapability = STANDARD_SENDER,
  pollMs = 2000,
): PublishSender {
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
      for (;;) {
        const receipt = (await provider.request({ method: "eth_getTransactionReceipt", params: [hash] })) as {
          status: Hex;
        } | null;
        if (receipt) {
          if (receipt.status !== "0x1") throw new Error(`Transaction ${tx.index + 1} (${hash}) reverted.`);
          return hash;
        }
        await new Promise((r) => setTimeout(r, pollMs));
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

/** Sends a plan in order and stops at the first failure. The plan's limits must fit the sender's. */
export async function sendPlan(
  plan: PublishPlan,
  sender: PublishSender,
  onSent?: (tx: PublishTx, hash: Hex | undefined) => void,
): Promise<(Hex | undefined)[]> {
  const c = sender.capability;
  if (
    plan.capability.maxCalldataBytes > c.maxCalldataBytes ||
    plan.capability.maxRecordsPerCall > c.maxRecordsPerCall
  ) {
    throw new Error("The plan was made for a sender with larger limits; plan again for this sender.");
  }
  const hashes: (Hex | undefined)[] = [];
  for (const tx of plan.txs) {
    const h = await sender.send(tx, plan);
    hashes.push(h);
    onSent?.(tx, h);
  }
  return hashes;
}
