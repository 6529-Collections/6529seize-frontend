import type { Address } from "viem";

import * as r8 from "./generated/r8/addresses";
import * as r9 from "./generated/r9/addresses";

/**
 * 6529 Stream contract instances on Sepolia. Every address the Stream test
 * pages use comes from here, keyed by instance name. The addresses are
 * generated from each instance's deployment record in the contracts repository
 * (scripts/stream/sync-stream-abis.cjs --record), never copied by hand.
 */
interface StreamInstance {
  /** Short instance name, as the contracts repository calls it. */
  readonly name: StreamInstanceName;
  /** The deployment record file in the contracts repository. */
  readonly record: string;
  /** The first block to scan for this instance's events. */
  readonly startBlock: bigint;
  /**
   * Whether any wallet can create a curated 6529 Stream work. r9 has a test
   * gate (SepoliaOpenGate) that approves any package and creates collections;
   * on r8 curation approval needs keys the website does not hold.
   */
  readonly curatedCreationOpen: boolean;
  readonly addresses: {
    readonly accounts: Address;
    readonly contentStore: Address;
    readonly economics: Address;
    readonly englishAuction: Address;
    readonly editionAuction: Address;
    readonly independentEditionAuction: Address;
    readonly independentRegistry: Address;
    readonly independent721Deployer: Address;
    readonly independentEditionsDeployer: Address;
    readonly packageRegistry: Address;
    readonly renderer: Address;
    readonly saleStarter: Address;
    /** SplitLedger, recorded as SplitFactory in the deployment record. */
    readonly splitLedger: Address;
    readonly stream: Address;
    readonly streamDirectory: Address;
    readonly streamEditions: Address;
    readonly workFacts: Address;
    readonly museumVault: Address;
    /** The test-only open gate, where the instance has one. */
    readonly openGate?: Address | undefined;
  };
}

type StreamInstanceName = "r9" | "r8";

const STREAM_INSTANCES: Record<StreamInstanceName, StreamInstance> = {
  r9: {
    name: "r9",
    record: r9.record,
    startBlock: r9.startBlock,
    curatedCreationOpen: true,
    addresses: r9.addresses,
  },
  r8: {
    name: "r8",
    record: r8.record,
    startBlock: r8.startBlock,
    curatedCreationOpen: false,
    addresses: r8.addresses,
  },
};

/** The current instance. Older ones stay readable so works made there can still be seen. */
export const DEFAULT_STREAM_INSTANCE: StreamInstanceName = "r9";
export const OLDER_STREAM_INSTANCES: readonly StreamInstanceName[] = ["r8"];

const STORAGE_KEY = "stream-sepolia-instance";

function isInstanceName(value: unknown): value is StreamInstanceName {
  return value === "r9" || value === "r8";
}

/** The visitor's choice, kept per browser; anything unreadable means the default. */
function chosenInstance(): StreamInstanceName {
  if (typeof window === "undefined") return DEFAULT_STREAM_INSTANCE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isInstanceName(stored) ? stored : DEFAULT_STREAM_INSTANCE;
  } catch {
    return DEFAULT_STREAM_INSTANCE;
  }
}

let active: StreamInstanceName | null = null;

export function getStreamInstance(): StreamInstance {
  active ??= chosenInstance();
  return STREAM_INSTANCES[active];
}

/** Switches instance and reloads, so no read of the other instance stays cached. */
export function switchStreamInstance(name: StreamInstanceName): void {
  try {
    if (name === DEFAULT_STREAM_INSTANCE) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Without storage the page stays on the default instance.
  }
  window.location.reload();
}
