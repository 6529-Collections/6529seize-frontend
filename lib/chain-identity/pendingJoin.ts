import type { Hex } from "viem";
import type { ChainDraft } from "./gateway";

/**
 * A wallet joining an identity signs IDENTITY_JOIN too. The identity's wallet
 * signs first; its signature waits here, in this browser, until the joining
 * wallet signs the same draft. It expires with the draft.
 */
export interface PendingJoin {
  readonly principalId: Hex;
  readonly identityWallet: Hex;
  readonly joiningWallet: Hex;
  readonly draft: ChainDraft;
  readonly identitySignature: Hex;
  readonly expiresAtMs: number;
}

const STORAGE_KEY = "6529-chain-pending-joins";

const readAll = (): PendingJoin[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingJoin[]) : [];
  } catch {
    return [];
  }
};

const listeners = new Set<() => void>();

const writeAll = (joins: readonly PendingJoin[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(joins));
  } catch {
    // Without storage the join has to be signed in one sitting.
  }
  listeners.forEach((listener) => listener());
};

const readRaw = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

let cachedRaw: string | null = null;
let cachedJoins: readonly PendingJoin[] = [];
const NO_JOINS: readonly PendingJoin[] = [];

const live = (nowMs: number) => (join: PendingJoin) =>
  join.expiresAtMs > nowMs;

export const pendingJoins = {
  /** Unexpired joins, oldest first. */
  list: (nowMs: number = Date.now()): PendingJoin[] =>
    readAll().filter(live(nowMs)),
  /** Keeps one pending join per joining wallet. */
  save: (join: PendingJoin, nowMs: number = Date.now()): void => {
    const joining = join.joiningWallet.toLowerCase();
    writeAll([
      ...readAll().filter(
        (item) =>
          live(nowMs)(item) && item.joiningWallet.toLowerCase() !== joining
      ),
      join,
    ]);
  },
  remove: (joiningWallet: Hex): void => {
    const joining = joiningWallet.toLowerCase();
    writeAll(
      readAll().filter((item) => item.joiningWallet.toLowerCase() !== joining)
    );
  },
};

/**
 * The held joins that were unexpired when they last changed; the same array
 * until one changes, as React's external stores need.
 */
export function snapshotPendingJoins(): readonly PendingJoin[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedJoins = raw === null ? NO_JOINS : readAll().filter(live(Date.now()));
  }
  return cachedJoins;
}

export const serverPendingJoins = (): readonly PendingJoin[] => NO_JOINS;

/** Calls `listener` when this tab or another one changes the held joins. */
export function subscribePendingJoins(listener: () => void): () => void {
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
