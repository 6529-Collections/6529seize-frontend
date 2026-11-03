import { trimHistory, updateHistorySummary, cacheMessage } from "./history";
import type { E2eeApiClient } from "../api";
import { MlsClient } from "../mls-adapter";
import type {
  StoredDevice,
  StoredGroup,
  StoredMessage,
  StoredOutboxItem,
} from "../records";
import {
  type E2eeStorage,
  type E2eeStorageBatch,
  isE2eeStateConflict,
} from "../storage";
import type { E2eeEngineOptions, E2eeScheduler, WasmModule } from "../types";
import type { DeviceDirectory } from "./directory";
import { E2eeError } from "./errors";
import type { SerialQueue, TaskTracker, TimerSet } from "./runtime";
import type { EngineStore, GroupRuntime } from "./store";

export const DAY_MS = 86_400_000;

export interface EngineContext {
  readonly options: E2eeEngineOptions;
  readonly api: E2eeApiClient;
  readonly storage: E2eeStorage;
  readonly profileId: string;
  readonly now: () => number;
  readonly random: () => number;
  readonly scheduler: E2eeScheduler;
  readonly queue: SerialQueue;
  readonly tasks: TaskTracker;
  readonly timers: TimerSet;
  readonly store: EngineStore;
  readonly directory: DeviceDirectory;
  wasm: WasmModule | null;
  mls: MlsClient | null;
  device: StoredDevice | null;
  /** WASM state as of the last checkpoint (rollback target). */
  lastState: Uint8Array | null;
  /**
   * Version of the persisted state this engine last loaded or wrote. Every
   * write is a compare-and-swap on it, so a stale tab never overwrites newer
   * state (and never brings deleted epoch secrets back to disk).
   */
  stateVersion: number;
  /** Serialises storage writes so each one sees the previous version. */
  persistChain: Promise<void>;
  disposed: boolean;
  lastMeAt: number;
  lastWakeAt: number;
  openConversation: string | null;
  openUntil: number;
}

export function requireMls(ctx: EngineContext): MlsClient {
  if (!ctx.mls || ctx.disposed) {
    throw new E2eeError(ctx.disposed ? "E2EE_DISPOSED" : "E2EE_NOT_READY");
  }
  return ctx.mls;
}

export function requireDevice(ctx: EngineContext): StoredDevice {
  if (!ctx.device?.registered || ctx.disposed) {
    throw new E2eeError(ctx.disposed ? "E2EE_DISPOSED" : "E2EE_NOT_READY");
  }
  return ctx.device;
}

export const ownDeviceKey = (ctx: EngineContext): string =>
  requireDevice(ctx).deviceKey;

export function requireGroup(ctx: EngineContext, g: string): GroupRuntime {
  const runtime = ctx.store.groups.get(g.toLowerCase());
  if (!runtime) {
    throw new E2eeError("E2EE_NO_CONVERSATION");
  }
  return runtime;
}

export function requireActiveGroup(
  ctx: EngineContext,
  g: string
): GroupRuntime {
  const runtime = requireGroup(ctx, g);
  if (runtime.record.status !== "active") {
    throw new E2eeError("E2EE_CONVERSATION_INACTIVE");
  }
  return runtime;
}

interface CheckpointExtra {
  groups?: readonly GroupRuntime[];
  deleteGroups?: string[];
  outbox?: StoredOutboxItem[];
  deleteOutbox?: string[];
  messages?: StoredMessage[];
  device?: StoredDevice;
  /** Skip exporting the WASM state (nothing MLS-related changed). */
  skipWasm?: boolean;
}

interface PreviousHistorySummary {
  runtime: GroupRuntime;
  history: StoredGroup["history"];
  readSeq: number;
}

function restoreHistorySummaries(
  ctx: EngineContext,
  previousSummaries: readonly PreviousHistorySummary[]
): void {
  // Dirty records remain retryable; their summary deltas must apply once.
  for (const previous of previousSummaries) {
    const { runtime, history, readSeq } = previous;
    if (history) {
      runtime.record.history = history;
      if (runtime.record.readSeq > readSeq) {
        history.unread = 0;
        history.mentions = 0;
      }
    } else delete runtime.record.history;
    ctx.store.touch(runtime.record.g);
  }
}

function finishHistoryCheckpoint(
  ctx: EngineContext,
  runtime: GroupRuntime
): void {
  for (const id of runtime.dirty) {
    const message = runtime.messages.get(id);
    if (message) {
      // Replace mutated objects so unchanged UI snapshots keep their identity.
      cacheMessage(runtime, structuredClone(message));
      if (runtime.followingLatest) runtime.windowIds?.add(id);
    }
  }
  for (const id of runtime.deleted) {
    runtime.originals.delete(id);
    runtime.windowIds?.delete(id);
  }
  runtime.dirty.clear();
  runtime.deleted.clear();
  if (runtime.followingLatest && runtime.windowIds) {
    const latest = [...runtime.messages.values()]
      .filter((message) => runtime.windowIds?.has(message.id))
      .sort((a, b) =>
        a.pending === b.pending
          ? a.seq - b.seq
          : Number(a.pending) - Number(b.pending)
      )
      .slice(-100);
    runtime.windowIds = new Set(latest.map((message) => message.id));
  }
  trimHistory(runtime, ctx.openConversation === runtime.record.g);
  ctx.store.touch(runtime.record.g);
}

/**
 * Persists the WASM state together with the given group records and their
 * changed messages in one atomic write. Called BEFORE submitting anything the
 * WASM produced (8.7) and after processing log items.
 */
function groupWrites(runtimes: readonly GroupRuntime[]): E2eeStorageBatch {
  const groups: StoredGroup[] = [];
  const messages: StoredMessage[] = [];
  const deleteMessages: { g: string; id: string }[] = [];
  for (const runtime of runtimes) {
    groups.push(runtime.record);
    for (const id of runtime.dirty) {
      const message = runtime.messages.get(id);
      if (message) {
        messages.push(message);
      }
    }
    for (const id of runtime.deleted) {
      deleteMessages.push({ g: runtime.record.g, id });
    }
  }
  return { groups, messages, deleteMessages };
}

/** Drops empty lists so a batch only touches what changed. */
function compact(batch: E2eeStorageBatch): E2eeStorageBatch {
  const out: E2eeStorageBatch = {};
  if (batch.device) {
    out.device = batch.device;
  }
  if (batch.wasmState) {
    out.wasmState = batch.wasmState;
  }
  const lists = [
    "groups",
    "deleteGroups",
    "messages",
    "deleteMessages",
    "outbox",
    "deleteOutbox",
  ] as const;
  for (const key of lists) {
    const value = batch[key];
    if (value !== undefined && value.length > 0) {
      Object.assign(out, { [key]: value });
    }
  }
  return out;
}

/**
 * Runs one storage write with this engine's state version. On success the
 * version moves on; on a conflict another engine owns newer state, so this
 * one stops (and tells its host) instead of writing anything else.
 */
function persist(
  ctx: EngineContext,
  write: (expectedVersion: number) => Promise<void>
): Promise<void> {
  const previous = ctx.persistChain;
  const run = (async () => {
    await previous;
    try {
      await write(ctx.stateVersion);
    } catch (error) {
      if (isE2eeStateConflict(error) && !ctx.disposed) {
        ctx.disposed = true;
        ctx.options.onStateConflict?.();
      }
      throw error;
    }
    ctx.stateVersion += 1;
  })();
  ctx.persistChain = run.catch(() => undefined);
  return run;
}

/** Clears this profile's local state under the engine's state version. */
export function clearStoredState(ctx: EngineContext): Promise<void> {
  return persist(ctx, (expectedVersion) =>
    ctx.storage.clearProfile(ctx.profileId, expectedVersion)
  );
}

/**
 * Persists the WASM state together with the given group records and their
 * changed messages in one atomic write. Called BEFORE submitting anything the
 * WASM produced (8.7) and after processing log items.
 */
export async function checkpoint(
  ctx: EngineContext,
  extra: CheckpointExtra = {}
): Promise<void> {
  const runtimes = extra.groups ?? [];
  const previousSummaries = runtimes.map((runtime) => ({
    runtime,
    history: runtime.record.history,
    readSeq: runtime.record.readSeq,
  }));
  const state =
    ctx.mls && extra.skipWasm !== true ? ctx.mls.exportState() : null;
  for (const runtime of runtimes) updateHistorySummary(ctx, runtime);
  const writes = groupWrites(runtimes);
  const batch = compact({
    ...writes,
    messages: [...(extra.messages ?? []), ...(writes.messages ?? [])],
    ...(state ? { wasmState: state } : {}),
    ...(extra.device ? { device: extra.device } : {}),
    ...(extra.deleteGroups ? { deleteGroups: extra.deleteGroups } : {}),
    ...(extra.outbox ? { outbox: extra.outbox } : {}),
    ...(extra.deleteOutbox ? { deleteOutbox: extra.deleteOutbox } : {}),
  });
  try {
    await persist(ctx, (expectedVersion) =>
      ctx.storage.writeBatch(ctx.profileId, { ...batch, expectedVersion })
    );
  } catch (error) {
    restoreHistorySummaries(ctx, previousSummaries);
    throw error;
  }
  if (state) {
    ctx.lastState = state;
  }
  for (const runtime of runtimes) finishHistoryCheckpoint(ctx, runtime);
}

/** Status check that also defeats stale narrowing across awaits. */
export const isActive = (
  runtime: GroupRuntime | undefined
): runtime is GroupRuntime => runtime?.record.status === "active";

/**
 * Restores the WASM state and group records of the last checkpoint after a
 * failure in the middle of processing (consumed ratchet secrets come back).
 */
export async function rollback(ctx: EngineContext): Promise<void> {
  if (!ctx.wasm || !ctx.lastState || ctx.disposed) {
    return;
  }
  ctx.mls?.dispose();
  ctx.mls = MlsClient.load(ctx.wasm, ctx.lastState);
  const stored = await ctx.storage.listGroups(ctx.profileId);
  for (const record of stored) {
    const runtime = ctx.store.groups.get(record.g);
    if (runtime) {
      runtime.record = record;
      runtime.messages.clear();
      runtime.originals.clear();
      runtime.dirty.clear();
      runtime.deleted.clear();
      const rows = await ctx.storage.pageMessages(ctx.profileId, record.g);
      for (const row of rows) cacheMessage(runtime, row);
      runtime.windowIds = null;
      runtime.followingLatest = true;
      trimHistory(runtime, ctx.openConversation === record.g);
    }
  }
  ctx.store.touch();
}
