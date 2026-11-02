import { MlsClient } from "../mls-adapter";
import { getDefaultE2eeStorage, isIndexedDbAvailable } from "../storage";
import type { E2eeEngineOptions, E2eeEngineStatus } from "../types";
import type { EngineContext } from "./context";
import { DeviceDirectory } from "./directory";
import { ensureWasm, loadCurrentSuiteDevice } from "./enroll";
import { E2eeError } from "./errors";
import { newRuntime } from "./groups";
import {
  createDefaultScheduler,
  SerialQueue,
  TaskTracker,
  TimerSet,
} from "./runtime";
import { EngineStore } from "./store";
import { hasPinnedWallets, isPinnedWallet } from "./trust";

/** Engine set-up: the context, its status, and restoring a stored device. */

export function supported(options: E2eeEngineOptions): boolean {
  const hasWasm =
    typeof WebAssembly === "object" || options.loadWasm !== undefined;
  const hasCrypto =
    typeof globalThis.crypto === "object" && "subtle" in globalThis.crypto;
  return (
    hasWasm &&
    hasCrypto &&
    (options.storage !== undefined || isIndexedDbAvailable())
  );
}

export function createContext(options: E2eeEngineOptions): EngineContext {
  const now = options.now ?? (() => Date.now());
  const scheduler = options.scheduler ?? createDefaultScheduler();
  const holder: { ctx: EngineContext | null } = { ctx: null };
  const directory = new DeviceDirectory({
    api: options.api,
    now,
    verifyContractSignature: options.verifyContractSignature,
    verifyEd25519: (pub, digest, sig) =>
      holder.ctx?.mls?.verifyEd25519(pub, digest, sig) ?? false,
    pinnedWallet: (profileId, wallet) => {
      const current = holder.ctx;
      if (!current) {
        return null;
      }
      if (isPinnedWallet(current, profileId, wallet)) {
        return true;
      }
      return hasPinnedWallets(current, profileId) ? false : null;
    },
  });
  const ctx: EngineContext = {
    options,
    api: options.api,
    storage: options.storage ?? getDefaultE2eeStorage(),
    profileId: options.profileId,
    now,
    random: options.random ?? Math.random,
    scheduler,
    queue: new SerialQueue(),
    tasks: new TaskTracker(),
    timers: new TimerSet(scheduler),
    store: new EngineStore(options.profileId, directory),
    directory,
    wasm: null,
    mls: null,
    device: null,
    lastState: null,
    stateVersion: 0,
    persistChain: Promise.resolve(),
    disposed: false,
    lastMeAt: 0,
    lastWakeAt: 0,
    openConversation: null,
    openUntil: 0,
  };
  holder.ctx = ctx;
  return ctx;
}

export function setStatus(
  ctx: EngineContext,
  status: E2eeEngineStatus,
  error: string | null = null
): void {
  ctx.store.status = status;
  ctx.store.error = error;
  ctx.store.touch();
}

export async function loadGroups(ctx: EngineContext): Promise<void> {
  const groups = await ctx.storage.listGroups(ctx.profileId);
  const outbox = await ctx.storage.listOutbox(ctx.profileId);
  for (const record of groups) {
    const runtime = newRuntime(record);
    for (const message of await ctx.storage.listMessages(
      ctx.profileId,
      record.g
    )) {
      runtime.messages.set(message.id, message);
    }
    for (const item of outbox.filter((entry) => entry.g === record.g)) {
      runtime.outbox.set(item.id, item);
    }
    ctx.store.groups.set(record.g, runtime);
  }
  const names = new Set(
    groups.flatMap((record) => record.members.map((m) => m.profileId))
  );
  await resolveProfiles(
    ctx,
    [...names].filter((id): id is string => id !== null)
  );
}

export function memberProfileIds(ctx: EngineContext): string[] {
  const ids = new Set<string>();
  for (const runtime of ctx.store.groups.values()) {
    for (const member of runtime.record.members) {
      if (member.profileId !== null) {
        ids.add(member.profileId);
      }
    }
  }
  return [...ids];
}

export async function resolveProfiles(
  ctx: EngineContext,
  profileIds: string[]
): Promise<void> {
  const missing = profileIds.filter((id) => !ctx.store.profiles.has(id));
  if (missing.length === 0) {
    return;
  }
  try {
    const resolved = await ctx.options.resolveProfiles(missing);
    for (const [id, info] of Object.entries(resolved)) {
      ctx.store.profiles.set(id, {
        handle: info.handle,
        pfp: info.pfp,
        wallets: [...info.wallets],
      });
    }
    ctx.store.touch();
  } catch {
    // Profiles are cosmetic; retried on the next change.
  }
}

/** Loads an enrolled device from storage; false when enrollment is needed. */
export async function restore(ctx: EngineContext): Promise<boolean> {
  const device = await loadCurrentSuiteDevice(ctx);
  if (!device?.registered || !device.provisioned) {
    return false;
  }
  const state = await ctx.storage.getWasmState(ctx.profileId);
  if (!state) {
    return false;
  }
  await ensureWasm(ctx);
  if (!ctx.wasm) {
    return false;
  }
  const mls = MlsClient.load(ctx.wasm, state);
  if (mls.deviceKey() !== device.deviceKey) {
    mls.dispose();
    throw new E2eeError("E2EE_DEVICE_MISMATCH");
  }
  ctx.mls = mls;
  ctx.lastState = state;
  ctx.device = device;
  await loadGroups(ctx);
  return true;
}
