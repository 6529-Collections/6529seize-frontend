import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import {
  toDisplayedDropContent,
  verifyDropSignedEvents,
  type DropSignatureVerdict,
  type GrantCheckCache,
} from "@/lib/device-signing/verify-signed-events";
import {
  fetchAuthorWallets,
  fetchDropSignedEvents,
  fetchDropsSignedEvents,
} from "@/services/api/device-grants-api";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { useCallback, useSyncExternalStore } from "react";
import { isDropAuthorSigned } from "./authorSignedClaim";
import { createRequestBudget, RateLimitedError } from "./requestBudget";
import {
  SIGNED_EVENTS_BATCH_MAX_DROPS,
  splitSignedEventsBatch,
  type BatchedSignedEvents,
} from "./signedEventsBatch";

/**
 * What a drop's seal may say, from this browser's own check:
 * "pending": not checked yet (or checking);
 * "verified": this browser verified the signature over the content shown;
 * "unverified": signed according to 6529.io, but this browser could not
 * verify it (a contract wallet, an unrecognized origin, a failed lookup);
 * "unlinked": the signing wallet is not one of the author's wallets now, so
 * the signature cannot be attributed to this author;
 * "failed": the signature does not verify or does not match the content.
 */
export type SealState =
  | "pending"
  | "verified"
  | "unverified"
  | "unlinked"
  | "failed";

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

/** A batch read's answer for one check, or why it has none. */
type LoadedSignedEvents =
  | BatchedSignedEvents
  | { readonly kind: "failed"; readonly error: unknown };

/** A check waiting for a free slot. */
interface QueuedCheck {
  readonly drop: VerdictDrop;
  readonly key: string;
  /** The drop's part of a batch read, once one includes this check. */
  loaded?: Promise<LoadedSignedEvents> | undefined;
}

/** Most recently checked drops, oldest first; drops on screen are kept. */
const MAX_ENTRIES = 500;
/**
 * Checks share the API's rate limit with loading the feed and posting, so
 * they stay well below it: at most 2 checks in flight and at most 2 requests
 * (a batch of signed events, one drop's signed events or an author's
 * wallets) started per second. A 429 pauses every check for its Retry-After
 * (5 s to 5 min); the affected seals stay pending and their checks continue
 * after the pause. A check that fails for any other reason or times out
 * (20 s) leaves the seal "unverified" for the rest of the page session and
 * is never retried by itself; the Signature dialog is the retry.
 */
const MAX_CONCURRENT_CHECKS = 2;
const requestBudget = createRequestBudget({
  maxRequestsPerWindow: 2,
  windowMs: 1000,
  minPauseMs: 5000,
  maxPauseMs: 5 * 60_000,
  timeoutMs: 20_000,
});
/**
 * Checks that become due within this long of each other share one batch
 * read of their signed events (up to SIGNED_EVENTS_BATCH_MAX_DROPS drops).
 * Checks that become due while a batch read waits for its turn or runs go
 * into the next one.
 */
const BATCH_WINDOW_MS = 100;
/** Author wallet lists are reused for this long, and at most this many. */
const AUTHOR_WALLETS_TTL_MS = 5 * 60_000;
const MAX_AUTHOR_WALLET_LISTS = 200;

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
/** Checks not started yet, by drop id, oldest first. */
const queue = new Map<string, QueuedCheck>();
/** How many visible seals want each drop checked. */
const demand = new Map<string, number>();
let running = 0;
let pumpTimer: ReturnType<typeof setTimeout> | null = null;
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let batchReadRunning = false;
/**
 * An API without the batch read (404 or 405) is read one drop at a time for
 * the rest of the page session.
 */
let batchReadUnsupported = false;
const grantChecks: GrantCheckCache = new Map();
/** By lower-case address, oldest first. */
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
    // JSON.stringify keeps array order and object key insertion order, so
    // equal content gives an equal key only because toDisplayedDropContent
    // always builds its objects with the same keys in the same order. Build
    // the key from such normalized values only, never from raw API objects,
    // whose key order may differ between read paths.
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
    case "unverifiable":
      return verdict.unlinkedWallet === undefined ? "unverified" : "unlinked";
    case "unsigned":
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

/** Forgets author wallet lists past their time, and the oldest beyond the cap. */
function forgetOldAuthorWallets(now: number): void {
  for (const [address, cached] of authorWallets) {
    if (
      authorWallets.size < MAX_AUTHOR_WALLET_LISTS &&
      now - cached.at < AUTHOR_WALLETS_TTL_MS
    ) {
      return;
    }
    authorWallets.delete(address);
  }
}

/** One shared request per author, with a signal of its own. */
function readAuthorWallets(primaryAddress: string): Promise<string[]> {
  const address = primaryAddress.toLowerCase();
  const now = Date.now();
  forgetOldAuthorWallets(now);
  const cached = authorWallets.get(address);
  if (cached && now - cached.at < AUTHOR_WALLETS_TTL_MS) {
    return cached.wallets;
  }
  const wallets = requestBudget.request((signal) =>
    fetchAuthorWallets(primaryAddress, signal)
  );
  authorWallets.delete(address);
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

/** The API has no batch read: an older API answers 404 or 405. */
const isBatchReadMissing = (error: unknown): boolean => {
  const status = getStructuredApiErrorStatus(error);
  return status === 404 || status === 405;
};

/**
 * A drop's signed events: from its batch read, or from the single-drop
 * route when the batch named it truncated, the batch read failed or the API
 * has no batch read. A drop the caller cannot read fails the check the way
 * a failed single-drop read does.
 */
async function readSignedEvents({
  drop,
  loaded,
}: QueuedCheck): Promise<ApiDropSignedEvents> {
  const result: LoadedSignedEvents =
    loaded === undefined ? { kind: "single" } : await loaded;
  switch (result.kind) {
    case "events":
      return result.signedEvents;
    case "single":
      return requestBudget.request((signal) =>
        fetchDropSignedEvents(drop.id, signal)
      );
    case "failed":
      throw result.error;
    case "unavailable":
    case "missing":
      // Settled like any failed read: "unverified" for the page session.
      throw new Error(`Signed events ${result.kind}`);
  }
}

async function checkDrop(check: QueuedCheck): Promise<void> {
  const { drop, key } = check;
  try {
    const signedEvents = await readSignedEvents(check);
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

/** The oldest queued checks no batch read included yet, at most one batch. */
function checksToBatch(): QueuedCheck[] {
  const checks: QueuedCheck[] = [];
  for (const check of queue.values()) {
    if (checks.length === SIGNED_EVENTS_BATCH_MAX_DROPS) {
      break;
    }
    if (check.loaded === undefined) {
      checks.push(check);
    }
  }
  return checks;
}

/** A settled batch read: what it says about each drop, or why it failed. */
type BatchOutcome =
  | { readonly byDrop: Map<string, BatchedSignedEvents> }
  | { readonly error: unknown };

/**
 * One batch read within the budget. It settles, never rejects, so a check
 * dropped from the queue before it starts never leaves a rejection unread.
 * A response that is not a batch counts as a failed read.
 */
async function readBatchOutcome(
  dropIds: readonly string[]
): Promise<BatchOutcome> {
  try {
    const response = await requestBudget.run((signal) =>
      fetchDropsSignedEvents(dropIds, signal)
    );
    return { byDrop: splitSignedEventsBatch(response, dropIds) };
  } catch (error) {
    return { error };
  }
}

/**
 * What one drop of a batch read gets once the read settled. A 429 keeps the
 * check pending until the pause ends. Any other failure (an API without the
 * batch read, a server error, a timeout, a network error or a response that
 * is not a batch) sends the drop to the single-drop route once, so one
 * failed read never decides a whole batch; only a drop whose own read also
 * fails is left unverified.
 */
function loadedFor(dropId: string, outcome: BatchOutcome): LoadedSignedEvents {
  if ("byDrop" in outcome) {
    return outcome.byDrop.get(dropId) ?? { kind: "missing" };
  }
  return outcome.error instanceof RateLimitedError
    ? { kind: "failed", error: outcome.error }
    : { kind: "single" };
}

/**
 * Reads the signed events of the oldest queued checks in one request, once
 * a request may start (so checks that became due meanwhile join in).
 */
async function readBatch(): Promise<void> {
  batchReadRunning = true;
  try {
    if (checksToBatch().length === 0) {
      return;
    }
    const giveBackSlot = await requestBudget.takeSlot();
    // Seals may have left the viewport while the read waited for its slot.
    const checks = checksToBatch();
    if (checks.length === 0) {
      giveBackSlot();
      return;
    }
    const dropIds = checks.map(({ drop }) => drop.id);
    const outcome = readBatchOutcome(dropIds);
    checks.forEach((check) => {
      check.loaded = outcome.then((settled) =>
        loadedFor(check.drop.id, settled)
      );
    });
    pump();
    const settled = await outcome;
    if ("error" in settled) {
      afterFailedBatchRead(settled.error, checks);
    }
  } finally {
    batchReadRunning = false;
    pump();
  }
}

function afterFailedBatchRead(
  error: unknown,
  checks: readonly QueuedCheck[]
): void {
  if (isBatchReadMissing(error)) {
    batchReadUnsupported = true;
    return;
  }
  if (error instanceof RateLimitedError) {
    // Checks still queued are read in a batch again after the pause; those
    // already started wait at the front of the queue (requeueAfterPause).
    checks.forEach((check) => {
      if (queue.get(check.drop.id) === check) {
        check.loaded = undefined;
      }
    });
  }
}

/** Starts a batch read soon if queued checks wait for their signed events. */
function scheduleBatchRead(): void {
  if (batchReadUnsupported || batchReadRunning || batchTimer !== null) {
    return;
  }
  if (![...queue.values()].some((check) => check.loaded === undefined)) {
    return;
  }
  batchTimer = setTimeout(() => {
    batchTimer = null;
    void readBatch();
  }, BATCH_WINDOW_MS);
}

/** The oldest queued check whose signed events are on their way. */
function nextCheckToStart(): QueuedCheck | undefined {
  for (const check of queue.values()) {
    if (batchReadUnsupported || check.loaded !== undefined) {
      return check;
    }
  }
  return undefined;
}

/** Starts queued checks into free slots, waiting out a pause first. */
function pump(): void {
  const pauseMs = requestBudget.pauseRemainingMs();
  if (pauseMs > 0) {
    pumpTimer ??= setTimeout(() => {
      pumpTimer = null;
      pump();
    }, pauseMs);
    return;
  }
  while (running < MAX_CONCURRENT_CHECKS) {
    const next = nextCheckToStart();
    if (next === undefined) {
      break;
    }
    queue.delete(next.drop.id);
    running += 1;
    void checkDrop(next).finally(() => {
      running -= 1;
      pump();
    });
  }
  scheduleBatchRead();
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
  // Always a new entry: no batch read has included it yet. The queue holds
  // at most one entry per drop.
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
