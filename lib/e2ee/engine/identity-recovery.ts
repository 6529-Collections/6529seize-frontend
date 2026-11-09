import type { StoredMessage } from "../records";
import { checkpoint, isDisposed, type EngineContext } from "./context";
import { loadMessage } from "./history";
import {
  knownDeviceProfile,
  profileOfLeaf,
  rememberDeviceProfile,
} from "./member-identity";
import type { GroupRuntime } from "./store";

/** One sync pass recovers at most eight uncached device owners across all chats. */
export interface RecoveryBudget {
  remaining: number;
}

async function recoverProfile(
  ctx: EngineContext,
  key: string,
  budget: RecoveryBudget
) {
  const known = knownDeviceProfile(ctx, key);
  if (known) return known;
  if (
    budget.remaining === 0 ||
    !ctx.lookupReads.canRead(`device:${key.toLowerCase()}`)
  )
    return null;
  budget.remaining -= 1;
  return profileOfLeaf(ctx, key);
}

/** Called inside the serial queue; touches only loaded history plus its previews. */
export async function recoverIdentities(
  ctx: EngineContext,
  runtime: GroupRuntime,
  budget: RecoveryBudget = { remaining: 8 },
  resume = false
): Promise<void> {
  if (ctx.disposed) return;
  const candidates = await recoveryCandidates(ctx, runtime);
  const keys = missingDeviceKeys(runtime, candidates);
  if (resume) {
    ctx.lookupReads.resume([
      ...[...keys].map((key) => `device:${key.toLowerCase()}`),
      ...runtime.record.members.flatMap((m) =>
        m.profileId ? [`profile:${m.profileId}`] : []
      ),
      ...runtime.record.metadata.admins.map((id) => `profile:${id}`),
    ]);
  }
  const resolved = new Map<string, string>();
  for (const key of keys) {
    const profileId = await recoverProfile(ctx, key, budget);
    if (isDisposed(ctx)) return;
    if (profileId) resolved.set(key.toLowerCase(), profileId);
  }
  if (applyRecoveredProfiles(runtime, candidates, resolved)) {
    await checkpoint(ctx, { groups: [runtime], skipWasm: true });
  }
}

async function recoveryCandidates(ctx: EngineContext, runtime: GroupRuntime) {
  const candidates = new Map(runtime.messages);
  for (const preview of [
    runtime.record.history?.last,
    runtime.record.history?.tail,
  ]) {
    if (
      preview?.senderProfileId === null &&
      preview.senderDeviceKey &&
      !candidates.has(preview.id)
    ) {
      const saved = await loadMessage(ctx, runtime, preview.id);
      if (saved) candidates.set(saved.id, saved);
    }
  }
  for (const message of candidates.values()) {
    if (message.senderDeviceKey)
      rememberDeviceProfile(
        ctx,
        message.senderDeviceKey,
        message.senderProfileId
      );
  }
  return candidates;
}

function missingDeviceKeys(
  runtime: GroupRuntime,
  candidates: ReadonlyMap<string, StoredMessage>
) {
  const keys = new Set(
    runtime.record.members
      .filter((m) => m.profileId === null)
      .map((m) => m.deviceKey)
  );
  for (const message of candidates.values()) {
    if (message.senderProfileId === null && message.senderDeviceKey)
      keys.add(message.senderDeviceKey);
  }
  return keys;
}

function applyRecoveredProfiles(
  runtime: GroupRuntime,
  candidates: ReadonlyMap<string, StoredMessage>,
  resolved: ReadonlyMap<string, string>
): boolean {
  let changed = false;
  for (const member of runtime.record.members) {
    const id = resolved.get(member.deviceKey.toLowerCase());
    if (member.profileId === null && id) {
      member.profileId = id;
      changed = true;
    }
  }
  for (const message of candidates.values()) {
    if (repairMessage(message, resolved)) {
      runtime.dirty.add(message.id);
      changed = true;
    }
  }
  return changed;
}

function repairMessage(
  message: StoredMessage,
  resolved: ReadonlyMap<string, string>
): boolean {
  if (message.senderProfileId !== null || !message.senderDeviceKey)
    return false;
  const id = resolved.get(message.senderDeviceKey.toLowerCase());
  if (!id) return false;
  message.senderProfileId = id;
  return true;
}

export async function recoverLoadedIdentities(
  ctx: EngineContext
): Promise<void> {
  const budget = { remaining: 8 };
  const groups = [...ctx.store.groups.values()];
  const opened = ctx.openConversation;
  groups.sort(
    (a, b) => Number(b.record.g === opened) - Number(a.record.g === opened)
  );
  for (const runtime of groups) await recoverIdentities(ctx, runtime, budget);
}
