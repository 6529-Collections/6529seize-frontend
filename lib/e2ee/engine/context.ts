import type { E2eeApiClient } from "../api";
import { MlsClient } from "../mls-adapter";
import type {
  StoredDevice,
  StoredGroup,
  StoredMessage,
  StoredOutboxItem,
} from "../records";
import type { E2eeStorage, E2eeStorageBatch } from "../storage";
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

export interface CheckpointExtra {
  groups?: readonly GroupRuntime[];
  deleteGroups?: string[];
  outbox?: StoredOutboxItem[];
  deleteOutbox?: string[];
  messages?: StoredMessage[];
  device?: StoredDevice;
  /** Skip exporting the WASM state (nothing MLS-related changed). */
  skipWasm?: boolean;
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
 * Persists the WASM state together with the given group records and their
 * changed messages in one atomic write. Called BEFORE submitting anything the
 * WASM produced (8.7) and after processing log items.
 */
export async function checkpoint(
  ctx: EngineContext,
  extra: CheckpointExtra = {}
): Promise<void> {
  const runtimes = extra.groups ?? [];
  const state =
    ctx.mls && extra.skipWasm !== true ? ctx.mls.exportState() : null;
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
  await ctx.storage.writeBatch(ctx.profileId, batch);
  if (state) {
    ctx.lastState = state;
  }
  for (const runtime of runtimes) {
    runtime.dirty.clear();
    runtime.deleted.clear();
  }
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
    }
  }
  ctx.store.touch();
}
