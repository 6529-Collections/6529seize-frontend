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

export function requireActiveGroup(ctx: EngineContext, g: string): GroupRuntime {
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
export async function checkpoint(
  ctx: EngineContext,
  extra: CheckpointExtra = {}
): Promise<void> {
  const batch: E2eeStorageBatch = {};
  let state: Uint8Array | null = null;
  if (ctx.mls && extra.skipWasm !== true) {
    state = ctx.mls.exportState();
    batch.wasmState = state;
  }
  const groups: StoredGroup[] = [];
  const messages: StoredMessage[] = [...(extra.messages ?? [])];
  const deleteMessages: { g: string; id: string }[] = [];
  for (const runtime of extra.groups ?? []) {
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
  if (groups.length > 0) {
    batch.groups = groups;
  }
  if (messages.length > 0) {
    batch.messages = messages;
  }
  if (deleteMessages.length > 0) {
    batch.deleteMessages = deleteMessages;
  }
  if (extra.deleteGroups?.length) {
    batch.deleteGroups = extra.deleteGroups;
  }
  if (extra.outbox?.length) {
    batch.outbox = extra.outbox;
  }
  if (extra.deleteOutbox?.length) {
    batch.deleteOutbox = extra.deleteOutbox;
  }
  if (extra.device) {
    batch.device = extra.device;
  }
  await ctx.storage.writeBatch(ctx.profileId, batch);
  if (state) {
    ctx.lastState = state;
  }
  for (const runtime of extra.groups ?? []) {
    runtime.dirty.clear();
    runtime.deleted.clear();
  }
}

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
