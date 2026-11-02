import {
  compareHistory,
  emptyHistorySummary,
  historyKey,
  isUnread,
  type HistoryPageOptions,
  type HistorySummary,
} from "../history-order";
import type { ImportedPayload } from "../imported-payload";
import type { Payload } from "../payload";
import type { StoredMessage } from "../records";
import type { EngineContext } from "./context";
import type { GroupRuntime } from "./store";

const HISTORY_PAGE_SIZE = 100;
const HISTORY_CACHE_LIMIT = 200;

/** Read processed plaintext records only. This never calls MLS. Call in the serial queue. */
export async function loadMessage(
  ctx: EngineContext,
  runtime: GroupRuntime,
  id: string
): Promise<StoredMessage | null> {
  const cached = runtime.messages.get(id);
  if (cached) return cached;
  const stored = await ctx.storage.getMessage(
    ctx.profileId,
    runtime.record.g,
    id
  );
  if (stored) cacheMessage(runtime, stored);
  return stored;
}

export function cacheMessage(
  runtime: GroupRuntime,
  message: StoredMessage
): void {
  runtime.messages.set(message.id, message);
  runtime.originals.set(message.id, structuredClone(message));
}

export async function duplicateImport(
  ctx: EngineContext,
  runtime: GroupRuntime,
  id: string,
  imp: ImportedPayload
): Promise<boolean> {
  // Dirty records have not reached the IndexedDB index yet (one log page).
  for (const dirty of runtime.dirty) {
    const message = runtime.messages.get(dirty);
    if (
      message &&
      message.id !== id &&
      !message.deleted &&
      message.imported?.w === imp.w &&
      message.imported.d === imp.d &&
      message.imported.p === imp.p
    )
      return true;
  }
  const matches = await ctx.storage.findImported(
    ctx.profileId,
    runtime.record.g,
    imp
  );
  return matches.some(
    (message) =>
      message.id !== id &&
      !runtime.deleted.has(message.id) &&
      !runtime.messages.get(message.id)?.deleted
  );
}

export async function preparePayload(
  ctx: EngineContext,
  runtime: GroupRuntime,
  payload: Payload
): Promise<boolean> {
  await loadMessage(
    ctx,
    runtime,
    payload.t === "msg" ? payload.id : payload.target
  );
  return (
    payload.t !== "msg" ||
    !payload.imp ||
    !(await duplicateImport(ctx, runtime, payload.id, payload.imp))
  );
}

function adjustUnread(
  summary: HistorySummary,
  message: StoredMessage | undefined,
  profileId: string,
  readSeq: number,
  sign: number
): void {
  if (!message || !isUnread(message, profileId, readSeq)) return;
  summary.unread += sign;
  if (message.mentions.includes(profileId)) summary.mentions += sign;
}

function updateLatest(summary: HistorySummary, message: StoredMessage): void {
  if (message.pending) return;
  summary.maxSeq = Math.max(summary.maxSeq, message.seq);
  if (
    !summary.tail ||
    summary.tail.id === message.id ||
    compareHistory(summary.tail, message) < 0
  )
    summary.tail = structuredClone(message);
  if (message.kind !== "message") return;
  if (
    !summary.last ||
    summary.last.id === message.id ||
    compareHistory(summary.last, message) < 0
  )
    summary.last = structuredClone(message);
}

export function updateHistorySummary(
  ctx: EngineContext,
  runtime: GroupRuntime
): void {
  const summary = { ...(runtime.record.history ?? emptyHistorySummary()) };
  for (const id of new Set([...runtime.dirty, ...runtime.deleted])) {
    const previous = runtime.originals.get(id);
    const current = runtime.deleted.has(id)
      ? undefined
      : runtime.messages.get(id);
    summary.count += Number(Boolean(current)) - Number(Boolean(previous));
    adjustUnread(summary, previous, ctx.profileId, runtime.record.readSeq, -1);
    adjustUnread(summary, current, ctx.profileId, runtime.record.readSeq, 1);
    if (current) updateLatest(summary, current);
  }
  runtime.record.history = summary;
}

/** Eviction is memory-only and runs only after a successful checkpoint. */
export function trimHistory(runtime: GroupRuntime, open: boolean): void {
  const ordered = [...runtime.messages.values()].sort(compareHistory);
  const keep = new Set(
    runtime.windowIds ??
      ordered
        .slice(-(open ? HISTORY_CACHE_LIMIT : HISTORY_PAGE_SIZE))
        .map((message) => message.id)
  );
  for (const message of ordered) {
    // Retain unsaved work without inserting off-window edits into the page
    // the reader selected. Pending echoes are displayed separately by the store.
    if (runtime.dirty.has(message.id)) keep.add(message.id);
  }
  for (const id of runtime.messages.keys()) {
    if (!keep.has(id)) {
      runtime.messages.delete(id);
      runtime.originals.delete(id);
    }
  }
}

export async function loadHistoryPage(
  ctx: EngineContext,
  runtime: GroupRuntime,
  options: HistoryPageOptions = {}
): Promise<void> {
  const rows = await ctx.storage.pageMessages(ctx.profileId, runtime.record.g, {
    ...options,
    limit: HISTORY_PAGE_SIZE,
  });
  for (const row of rows)
    if (!runtime.dirty.has(row.id)) cacheMessage(runtime, row);
  const current = [...runtime.messages.values()]
    .filter((message) => runtime.windowIds?.has(message.id))
    .sort(compareHistory);
  const overlap = options.before
    ? current.slice(0, HISTORY_PAGE_SIZE)
    : current.slice(-HISTORY_PAGE_SIZE);
  runtime.windowIds =
    options.before || options.after
      ? new Set([...rows, ...overlap].map((message) => message.id))
      : null;
  runtime.historyLoaded = true;
  // The newest page may coexist with records used by a targeted operation.
  if (runtime.windowIds === null) {
    const newest = [...runtime.messages.values()]
      .sort(compareHistory)
      .slice(-HISTORY_PAGE_SIZE);
    runtime.windowIds = new Set(newest.map((message) => message.id));
    runtime.followingLatest = true;
  } else runtime.followingLatest = false;
  trimHistory(runtime, true);
  runtime.historyError = false;
  ctx.store.touch(runtime.record.g);
}

export async function historyAround(
  ctx: EngineContext,
  runtime: GroupRuntime,
  id: string
): Promise<void> {
  const message = await loadMessage(ctx, runtime, id);
  if (!message) return;
  const [before, after] = await Promise.all([
    ctx.storage.pageMessages(ctx.profileId, runtime.record.g, {
      before: historyKey(message),
      limit: 50,
    }),
    ctx.storage.pageMessages(ctx.profileId, runtime.record.g, {
      after: historyKey(message),
      limit: 49,
    }),
  ]);
  const rows = [...before, message, ...after];
  for (const row of rows)
    if (!runtime.dirty.has(row.id)) cacheMessage(runtime, row);
  runtime.windowIds = new Set(rows.map((row) => row.id));
  runtime.followingLatest = false;
  runtime.historyLoaded = true;
  trimHistory(runtime, true);
  ctx.store.touch(runtime.record.g);
}
