import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  toDisplayedDropContent,
  verifyDropSignedEvents,
  type DropSignatureVerdict,
  type GrantCheckCache,
} from "@/lib/device-signing/verify-signed-events";
import {
  fetchAuthorWallets,
  fetchDropSignedEvents,
} from "@/services/api/device-grants-api";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { useCallback, useSyncExternalStore } from "react";
import { isDropAuthorSigned } from "./authorSignedClaim";

/**
 * What a drop's seal may say, from this browser's own check:
 * "pending": not checked yet (or checking);
 * "verified": this browser verified the signature over the content shown;
 * "unverified": signed according to 6529.io, but this browser could not
 * verify it (a contract wallet, an unrecognized origin, a failed lookup);
 * "failed": the signature does not verify or does not match the content.
 */
export type SealState = "pending" | "verified" | "unverified" | "failed";

/** What is shown of a drop and checked against its signed body. */
export type SignedContentDrop = Pick<
  ApiDrop,
  "title" | "parts" | "wave" | "author"
> &
  Partial<Pick<ApiDrop, "reply_to" | "parts_count">>;

export type VerdictDrop = SignedContentDrop &
  Pick<ApiDrop, "id" | "is_author_signed">;

interface Entry {
  /** The content the state was checked against. */
  readonly key: string;
  readonly state: SealState;
}

/** A check waiting for a free slot. */
interface QueuedCheck {
  readonly drop: VerdictDrop;
  readonly key: string;
}

/** Most recently checked drops, oldest first; drops on screen are kept. */
const MAX_ENTRIES = 500;
/**
 * Checks share the API's rate limit with loading the feed and posting, so
 * they stay well below it: at most 2 checks in flight and at most 2 requests
 * (a drop's signed events or an author's wallets) started per second.
 */
const MAX_CONCURRENT_CHECKS = 2;
const MAX_REQUESTS_PER_WINDOW = 2;
const REQUEST_WINDOW_MS = 1000;
/**
 * A 429 pauses every check for its Retry-After, never less than this; the
 * affected seals stay pending and their checks continue after the pause.
 */
const MIN_RATE_LIMIT_PAUSE_MS = 5000;
const MAX_RATE_LIMIT_PAUSE_MS = 5 * 60_000;
/**
 * A check that fails for any other reason or times out leaves the seal
 * "unverified" for the rest of the page session and is never retried by
 * itself; the Signature dialog is the retry.
 */
const REQUEST_TIMEOUT_MS = 20_000;
/** Author wallet lists are reused for this long. */
const AUTHOR_WALLETS_TTL_MS = 5 * 60_000;

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
/** Checks not started yet, by drop id, oldest first. */
const queue = new Map<string, QueuedCheck>();
/** How many visible seals want each drop checked. */
const demand = new Map<string, number>();
let running = 0;
/** Start times of recent requests, oldest first. */
const requestStarts: number[] = [];
/** No request starts before this time (after a 429). */
let pausedUntil = 0;
let pumpTimer: ReturnType<typeof setTimeout> | null = null;
const grantChecks: GrantCheckCache = new Map();
const authorWallets = new Map<
  string,
  { readonly at: number; readonly wallets: Promise<string[]> }
>();

// Drops are immutable query data, so a drop object's content key never
// changes; new data arrives as a new object.
const contentKeys = new WeakMap<object, string>();

function contentKey(drop: SignedContentDrop): string {
  let key = contentKeys.get(drop);
  if (key === undefined) {
    key = JSON.stringify([
      drop.wave.id,
      drop.author.primary_address,
      toDisplayedDropContent(drop),
    ]);
    contentKeys.set(drop, key);
  }
  return key;
}

function notify(dropId: string): void {
  listeners.get(dropId)?.forEach((listener) => listener());
}

/** Forgets the oldest verdict whose drop no seal on screen shows. */
function evictOldestEntry(): void {
  for (const dropId of entries.keys()) {
    if (!demand.has(dropId) && !listeners.has(dropId)) {
      entries.delete(dropId);
      return;
    }
  }
}

function setEntry(dropId: string, entry: Entry): void {
  entries.delete(dropId);
  entries.set(dropId, entry);
  if (entries.size > MAX_ENTRIES) {
    evictOldestEntry();
  }
  notify(dropId);
}

/**
 * Settles a check unless the drop's content changed while it ran or the
 * Signature dialog reached its own verdict meanwhile.
 */
function settle(dropId: string, key: string, state: SealState): void {
  const entry = entries.get(dropId);
  if (entry?.key === key && entry.state === "pending") {
    setEntry(dropId, { key, state });
  }
}

/** The inline seal state a full verdict allows. */
function sealStateFromVerdict(verdict: DropSignatureVerdict): SealState {
  switch (verdict.status) {
    case "signed":
      return verdict.currentContentSigned ? "verified" : "unverified";
    case "invalid":
      return "failed";
    case "unsigned":
    case "unverifiable":
      return "unverified";
  }
}

/** This browser's verdict for the drop as shown, or "pending". */
function readSealState(drop: VerdictDrop): SealState {
  // Drops 6529.io does not mark as signed are never checked (and lists may
  // hold partial drop data for them).
  if (!isDropAuthorSigned(drop)) {
    return "pending";
  }
  const entry = entries.get(drop.id);
  return entry?.key === contentKey(drop) ? entry.state : "pending";
}

/** Records a verdict reached elsewhere (the Signature dialog). */
export function recordDropSignatureVerdict(
  dropId: string,
  drop: SignedContentDrop,
  verdict: DropSignatureVerdict
): void {
  setEntry(dropId, {
    key: contentKey(drop),
    state: sealStateFromVerdict(verdict),
  });
}

/** A request refused with 429: every check pauses, nothing failed. */
class RateLimitedError extends Error {}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Waits until a request may start: after any pause, within the budget. */
async function takeRequestSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (
      requestStarts.length > 0 &&
      (now - (requestStarts[0] ?? now) >= REQUEST_WINDOW_MS ||
        (requestStarts[0] ?? now) > now)
    ) {
      requestStarts.shift();
    }
    const oldest = requestStarts[0];
    const budgetWait =
      requestStarts.length >= MAX_REQUESTS_PER_WINDOW && oldest !== undefined
        ? oldest + REQUEST_WINDOW_MS - now
        : 0;
    const waitMs = Math.max(pausedUntil - now, budgetWait);
    if (waitMs <= 0) {
      requestStarts.push(now);
      return;
    }
    await wait(waitMs);
  }
}

/** The pause a 429 asks for (Retry-After in seconds or as a date). */
function rateLimitPauseMs(error: unknown): number {
  const headers =
    typeof error === "object" && error !== null && "headers" in error
      ? (error as { readonly headers?: { get?: unknown } }).headers
      : undefined;
  const value =
    typeof headers?.get === "function"
      ? (headers.get as (name: string) => string | null)("retry-after")
      : null;
  let requested = 0;
  if (value !== null && value.trim() !== "") {
    const seconds = Number(value);
    requested = Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(value) - Date.now();
  }
  return Math.min(
    MAX_RATE_LIMIT_PAUSE_MS,
    Math.max(
      MIN_RATE_LIMIT_PAUSE_MS,
      Number.isFinite(requested) ? requested : 0
    )
  );
}

/** One request within the budget, with its own timeout. */
async function budgetedRequest<T>(
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  await takeRequestSlot();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (getStructuredApiErrorStatus(error) === 429) {
      pausedUntil = Math.max(pausedUntil, Date.now() + rateLimitPauseMs(error));
      throw new RateLimitedError("rate limited");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** One shared request per author, with a signal of its own. */
function readAuthorWallets(primaryAddress: string): Promise<string[]> {
  const address = primaryAddress.toLowerCase();
  const now = Date.now();
  const cached = authorWallets.get(address);
  if (cached && now - cached.at < AUTHOR_WALLETS_TTL_MS) {
    return cached.wallets;
  }
  const wallets = budgetedRequest((signal) =>
    fetchAuthorWallets(primaryAddress, signal)
  );
  authorWallets.set(address, { at: now, wallets });
  wallets.catch(() => {
    if (authorWallets.get(address)?.wallets === wallets) {
      authorWallets.delete(address);
    }
  });
  return wallets;
}

/**
 * After a 429 the check waits at the front of the queue, its seal still
 * pending, unless no seal wants it any more.
 */
function requeueAfterPause(drop: VerdictDrop, key: string): void {
  const entry = entries.get(drop.id);
  if (entry?.key !== key || entry.state !== "pending") {
    return;
  }
  if (!demand.has(drop.id)) {
    entries.delete(drop.id);
    notify(drop.id);
    return;
  }
  const waiting = [...queue].filter(([dropId]) => dropId !== drop.id);
  queue.clear();
  queue.set(drop.id, { drop, key });
  waiting.forEach(([dropId, check]) => queue.set(dropId, check));
}

async function checkDrop(drop: VerdictDrop, key: string): Promise<void> {
  try {
    const signedEvents = await budgetedRequest((signal) =>
      fetchDropSignedEvents(drop.id, signal)
    );
    const authorAddress = drop.author.primary_address;
    const wallets =
      authorAddress && signedEvents.events.length > 0
        ? await readAuthorWallets(authorAddress)
        : [];
    // No contract-wallet reader: a contract wallet's grant stays
    // "unverified" here and is checked on Ethereum in the Signature dialog.
    const verdict = await verifyDropSignedEvents(signedEvents, {
      displayed: toDisplayedDropContent(drop),
      expected: {
        dropId: drop.id,
        waveId: drop.wave.id,
        authorWallets: wallets,
      },
      grantCheckCache: grantChecks,
    });
    settle(drop.id, key, sealStateFromVerdict(verdict));
  } catch (error) {
    if (error instanceof RateLimitedError) {
      requeueAfterPause(drop, key);
    } else {
      settle(drop.id, key, "unverified");
    }
  }
}

/** Starts queued checks into free slots, waiting out a pause first. */
function pump(): void {
  const pauseMs = pausedUntil - Date.now();
  if (pauseMs > 0) {
    pumpTimer ??= setTimeout(() => {
      pumpTimer = null;
      pump();
    }, pauseMs);
    return;
  }
  while (running < MAX_CONCURRENT_CHECKS) {
    const next = queue.entries().next().value;
    if (next === undefined) {
      return;
    }
    const [dropId, { drop, key }] = next;
    queue.delete(dropId);
    running += 1;
    void checkDrop(drop, key).finally(() => {
      running -= 1;
      pump();
    });
  }
}

/**
 * Queues this browser's check of a drop 6529.io marks as author signed,
 * unless the content shown was already checked, is queued or is running
 * (identical checks are never repeated). At most MAX_CONCURRENT_CHECKS run
 * at once; the rest wait in order.
 */
function requestDropSignatureCheck(drop: VerdictDrop): void {
  if (!isDropAuthorSigned(drop)) {
    return;
  }
  const key = contentKey(drop);
  if (entries.get(drop.id)?.key === key) {
    return;
  }
  setEntry(drop.id, { key, state: "pending" });
  queue.set(drop.id, { drop, key });
  pump();
}

/**
 * A queued check nobody waits for any more (its seals unmounted or left the
 * viewport) is dropped before it starts, so scrolling through a long chat
 * never builds a backlog. It is queued again if a seal shows it later.
 */
function releaseDropSignatureCheck(dropId: string): void {
  const wanted = (demand.get(dropId) ?? 1) - 1;
  if (wanted > 0) {
    demand.set(dropId, wanted);
    return;
  }
  demand.delete(dropId);
  if (queue.delete(dropId)) {
    entries.delete(dropId);
    notify(dropId);
  }
}

/** Visible seals want these drops checked until the returned release. */
function wantDropSignatureChecks(drops: readonly VerdictDrop[]): () => void {
  const wanted = drops.filter(isDropAuthorSigned);
  wanted.forEach((drop) => {
    demand.set(drop.id, (demand.get(drop.id) ?? 0) + 1);
  });
  wanted.forEach(requestDropSignatureCheck);
  return () => wanted.forEach((drop) => releaseDropSignatureCheck(drop.id));
}

function subscribeDrops(ids: readonly string[], listener: () => void) {
  ids.forEach((id) => {
    const set = listeners.get(id) ?? new Set();
    set.add(listener);
    listeners.set(id, set);
  });
  return () => {
    ids.forEach((id) => {
      const set = listeners.get(id);
      set?.delete(listener);
      if (set?.size === 0) {
        listeners.delete(id);
      }
    });
  };
}

const ID_SEPARATOR = "\n";

/**
 * The seal state of each drop, re-rendering only when one of them changes.
 * While `active` (the seal is near the viewport), drops not yet checked are
 * queued for a check; a queued check is dropped when no seal wants it.
 */
export function useDropSealStates(
  drops: readonly VerdictDrop[],
  active: boolean
): readonly SealState[] {
  // Subscribing starts the checks of drops not yet checked, so new drop
  // data (a new object, perhaps new content) is checked as it arrives.
  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribe = subscribeDrops(
        drops.map((drop) => drop.id),
        listener
      );
      const release = active ? wantDropSignatureChecks(drops) : undefined;
      return () => {
        release?.();
        unsubscribe();
      };
    },
    [active, drops]
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () => drops.map(readSealState).join(ID_SEPARATOR),
    () => drops.map((): SealState => "pending").join(ID_SEPARATOR)
  );
  return drops.length === 0
    ? []
    : (snapshot.split(ID_SEPARATOR) as SealState[]);
}
