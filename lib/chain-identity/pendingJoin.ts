import type { Hex } from "viem";

/**
 * Joins this browser started: the identity's wallet signed IDENTITY_JOIN and
 * 6529.io's relay holds it until the joining wallet signs (lib/chain-identity
 * /relay.ts). The relay lists a join only to the wallet that still has to
 * sign, so this browser remembers the ones it started, to show and cancel
 * them. Only ids and addresses are kept here, never a signature.
 */
export interface StartedJoin {
  readonly txId: Hex;
  readonly principalId: Hex;
  readonly identityWallet: Hex;
  readonly joiningWallet: Hex;
  readonly expiresAtMs: number;
}

const STORAGE_KEY = "6529-chain-started-joins";

const isStartedJoin = (value: unknown): value is StartedJoin => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item["txId"] === "string" &&
    typeof item["principalId"] === "string" &&
    typeof item["identityWallet"] === "string" &&
    typeof item["joiningWallet"] === "string" &&
    typeof item["expiresAtMs"] === "number"
  );
};

const readRaw = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const parse = (raw: string | null): StartedJoin[] => {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isStartedJoin) : [];
  } catch {
    return [];
  }
};

const listeners = new Set<() => void>();

const writeAll = (joins: readonly StartedJoin[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(joins));
  } catch {
    // Without storage the join still waits at the relay; only this list is lost.
  }
  listeners.forEach((listener) => listener());
};

const live = (nowMs: number) => (join: StartedJoin) => join.expiresAtMs > nowMs;

export const startedJoins = {
  /** Keeps one join per joining wallet, dropping expired ones. */
  save: (join: StartedJoin, nowMs: number = Date.now()): void => {
    const joining = join.joiningWallet.toLowerCase();
    writeAll([
      ...parse(readRaw()).filter(
        (item) =>
          live(nowMs)(item) && item.joiningWallet.toLowerCase() !== joining
      ),
      join,
    ]);
  },
  remove: (txId: Hex): void => {
    const id = txId.toLowerCase();
    writeAll(parse(readRaw()).filter((item) => item.txId.toLowerCase() !== id));
  },
};

let cachedRaw: string | null = null;
let cachedJoins: readonly StartedJoin[] = [];
const NO_JOINS: readonly StartedJoin[] = [];

/**
 * The started joins that were unexpired when they last changed; the same
 * array until one changes, as React's external stores need.
 */
export function snapshotStartedJoins(): readonly StartedJoin[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedJoins = raw === null ? NO_JOINS : parse(raw).filter(live(Date.now()));
  }
  return cachedJoins;
}

export const serverStartedJoins = (): readonly StartedJoin[] => NO_JOINS;

/** Calls `listener` when this tab or another one changes the started joins. */
export function subscribeStartedJoins(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };
  listeners.add(listener);
  globalThis.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener("storage", onStorage);
  };
}
