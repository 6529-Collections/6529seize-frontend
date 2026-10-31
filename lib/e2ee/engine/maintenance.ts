import { asE2eeApiError } from "../api";
import { digestBytes, rosterDigest } from "../digests";
import type { ApiE2eeDevice } from "../api-types";
import type { E2eeUntrustedDevice } from "../types";
import type { WasmCommitOps } from "../wasm-types";
import { claimedDevices, claimKeyPackages, isUsableDevice } from "./claims";
import { submitCommit, type CommitIntent, type CommitOutcome } from "./commit";
import {
  isActive,
  ownDeviceKey,
  requireMls,
  type EngineContext,
} from "./context";
import { RetryableError } from "./errors";
import {
  computeRequiredChanges,
  type DeviceStatus,
  type RequiredChanges,
} from "./required-changes";
import { sleep } from "./runtime";
import type { GroupRuntime } from "./store";
import { catchUpGroup } from "./sync";
import {
  deviceTrust,
  isIgnoredDevice,
  onlyTrustedPackages,
  pinLeavesOnFirstSighting,
} from "./trust";

/** 8.2-8.5: required changes, stalls, self-updates, device adds, roster repair. */

const STALL_MS = 20_000;
export const STALL_RETRY_MS = 5_000;
export const MAX_LEAVES_PER_COMMIT = 200;
const OTHER_ADD_MIN_MS = 5_000;
const OTHER_ADD_SPAN_MS = 25_000;
const ROSTER_SPAN_MS = 10_000;

const isNetworkish = (error: unknown): boolean => {
  if (error instanceof RetryableError) {
    return true;
  }
  const apiError = asE2eeApiError(error);
  return (
    apiError !== null &&
    (apiError.status === 0 || apiError.status >= 500 || apiError.status === 429)
  );
};

async function deviceStatuses(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<Map<string, DeviceStatus>> {
  const statuses = new Map<string, DeviceStatus>();
  for (const member of runtime.record.members) {
    const device = await ctx.directory.getDevice(member.deviceKey);
    if (!device) {
      statuses.set(member.deviceKey, {
        revoked: false,
        expiresAt: null,
        badGrant: true,
      });
      continue;
    }
    const revoked =
      device.revoked_at !== null &&
      (await ctx.directory.revocationState(device)) === "verified";
    statuses.set(member.deviceKey, {
      revoked,
      expiresAt: device.grant.expires_at * 1000,
      badGrant: false,
    });
  }
  return statuses;
}

const untrustedEntry = (
  device: ApiE2eeDevice,
  reason: E2eeUntrustedDevice["reason"]
): E2eeUntrustedDevice => ({
  profileId: device.profile_id,
  deviceKey: device.device_key.toLowerCase(),
  wallet: device.grant.wallet.toLowerCase(),
  reason,
});

/**
 * Trusted active devices per member principal (engine/trust.ts); the others
 * are listed for "Add device" unless they are leaves already or ignored.
 */
async function activeDevices(
  ctx: EngineContext,
  runtime: GroupRuntime,
  onlyOwn: boolean
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const principals = new Set(
    runtime.record.members
      .map((member) => member.profileId)
      .filter(
        (id): id is string => id !== null && (!onlyOwn || id === ctx.profileId)
      )
  );
  const leaves = new Set(runtime.record.members.map((m) => m.deviceKey));
  await pinLeavesOnFirstSighting(
    ctx,
    runtime.record.members.filter(
      (member) => member.profileId !== null && principals.has(member.profileId)
    )
  );
  for (const profileId of principals) {
    const keys: string[] = [];
    const untrusted: E2eeUntrustedDevice[] = [];
    for (const device of await ctx.directory.getProfileDevices(profileId)) {
      const key = device.device_key.toLowerCase();
      if (
        device.profile_id !== profileId ||
        !(await isUsableDevice(ctx, device))
      ) {
        continue;
      }
      const trust = await deviceTrust(ctx, device);
      if (trust === "trusted") {
        keys.push(key);
      } else if (!leaves.has(key) && !isIgnoredDevice(ctx, key)) {
        untrusted.push(untrustedEntry(device, trust));
      }
    }
    out.set(profileId, keys);
    ctx.store.setUntrusted(profileId, untrusted);
  }
  return out;
}

export async function groupChanges(
  ctx: EngineContext,
  runtime: GroupRuntime,
  options: { onlyOwnAdds: boolean }
): Promise<RequiredChanges> {
  const record = runtime.record;
  return computeRequiredChanges({
    now: ctx.now(),
    ownDeviceKey: ownDeviceKey(ctx),
    ownProfileId: ctx.profileId,
    members: record.members,
    leaving: new Set(record.leaving),
    badGrants: new Set(record.badGrants),
    deviceStatus: await deviceStatuses(ctx, runtime),
    activity: record.activity,
    lastSelfUpdateAt: record.lastSelfUpdateAt,
    selfUpdateRequested: record.selfUpdateRequested,
    activeDevices: await activeDevices(ctx, runtime, options.onlyOwnAdds),
  });
}

export type Planner = (
  runtime: GroupRuntime
) => CommitIntent | null | Promise<CommitIntent | null>;

/**
 * Planner for required changes: removals, adds (own always; others when
 * `includeOtherAdds`) and, when `allowSelfUpdate`, a due self-update.
 */
export function requiredChangesPlanner(options: {
  ctx: EngineContext;
  includeOtherAdds: boolean;
  allowSelfUpdate: boolean;
}): Planner {
  const { ctx } = options;
  return async (runtime) => {
    const changes = await groupChanges(ctx, runtime, {
      onlyOwnAdds: !options.includeOtherAdds,
    });
    const removals = [...changes.strictRemovals, ...changes.idleRemovals];
    const addTargets = new Map<string, string[]>();
    const adds = [
      ...changes.ownAdds.map((deviceKey) => ({
        profileId: ctx.profileId,
        deviceKey,
      })),
      ...(options.includeOtherAdds ? changes.otherAdds : []),
    ].slice(0, MAX_LEAVES_PER_COMMIT);
    for (const add of adds) {
      addTargets.set(add.profileId, [
        ...(addTargets.get(add.profileId) ?? []),
        add.deviceKey,
      ]);
    }
    const claimed =
      addTargets.size > 0
        ? await claimKeyPackages(
            ctx,
            [...addTargets].map(([profile_id, device_keys]) => ({
              profile_id,
              device_keys,
            })),
            runtime.record.g
          )
        : null;
    const ops: WasmCommitOps = {};
    if (removals.length > 0) {
      ops.remove_device_keys = removals;
      // Leave proposals ride along by reference (the store is then empty).
      ops.include_pending_proposals = runtime.record.leaving.length > 0;
    }
    // The claimed record must still be trusted, not just the listed one.
    const packages = await onlyTrustedPackages(ctx, claimed?.packages ?? []);
    if (packages.length > 0) {
      ops.add_key_packages = packages.map((item) => item.keyPackage);
    }
    const selfUpdate = options.allowSelfUpdate && changes.selfUpdateDue;
    if (Object.keys(ops).length === 0 && !selfUpdate) {
      return null;
    }
    if (selfUpdate && removals.length === 0) {
      ops.self_update = true;
    }
    return { ops, claimed: claimedDevices(packages) };
  };
}

type CommitRun =
  | { kind: "done"; seq: number | null }
  | { kind: "delayed" }
  | { kind: "rejected"; code: string | null };

export function clearStallFor(
  ctx: EngineContext,
  runtime: GroupRuntime | undefined
): void {
  if (!runtime) {
    return;
  }
  runtime.stallSince = null;
  if (runtime.record.delayed) {
    runtime.record.delayed = false;
    ctx.store.touch(runtime.record.g);
  }
}

type AttemptOutcome = CommitOutcome | { kind: "noop" };

async function commitAttempt(
  ctx: EngineContext,
  g: string,
  planner: Planner
): Promise<AttemptOutcome> {
  return ctx.queue.run(async () => {
    const runtime = ctx.store.groups.get(g);
    if (!isActive(runtime)) {
      return { kind: "noop" };
    }
    try {
      await catchUpGroup(ctx, runtime);
      if (!isActive(runtime)) {
        return { kind: "noop" };
      }
      const intent = await planner(runtime);
      return intent
        ? await submitCommit(ctx, runtime, intent)
        : { kind: "noop" };
    } catch (error) {
      if (isNetworkish(error)) {
        return { kind: "failed" };
      }
      throw error;
    }
  });
}

const backoffMs = (ctx: EngineContext, attempt: number): number =>
  Math.min(STALL_RETRY_MS, 250 * 2 ** attempt) * (0.5 + ctx.random() / 2);

/** Notes a failed attempt; returns true once the 20 s stall rule trips. */
export function noteStallFor(
  ctx: EngineContext,
  runtime: GroupRuntime | undefined
): boolean {
  if (!runtime) {
    return false;
  }
  const now = ctx.now();
  runtime.stallSince ??= now;
  if (now - runtime.stallSince < STALL_MS) {
    return false;
  }
  if (!runtime.record.delayed) {
    runtime.record.delayed = true;
    ctx.store.touch(runtime.record.g);
  }
  return true;
}

/**
 * 8.3: catch up, plan and submit until the commit is sequenced, nothing is
 * left to do, or the stall rule trips (then a background retry is armed).
 */
export async function runGroupCommit(
  ctx: EngineContext,
  g: string,
  planner: Planner,
  onDelayed: () => void
): Promise<CommitRun> {
  let attempt = 0;
  let conflicts = 0;
  for (;;) {
    const outcome = await commitAttempt(ctx, g, planner);
    const runtime = ctx.store.groups.get(g);
    if (outcome.kind === "ok" || outcome.kind === "noop") {
      clearStallFor(ctx, runtime);
      return { kind: "done", seq: outcome.kind === "ok" ? outcome.seq : null };
    }
    if (outcome.kind === "rejected") {
      clearStallFor(ctx, runtime);
      return { kind: "rejected", code: outcome.code };
    }
    if (outcome.kind === "conflict") {
      conflicts += 1;
      if (conflicts === 1) {
        continue; // First 409: catch up and retry at once.
      }
    }
    if (noteStallFor(ctx, runtime)) {
      onDelayed();
      return { kind: "delayed" };
    }
    await sleep(ctx.scheduler, backoffMs(ctx, attempt));
    attempt += 1;
  }
}

// ---------------------------------------------------------------------------
// Roster repair (8.5)
// ---------------------------------------------------------------------------

export async function repairRoster(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<void> {
  const record = runtime.record;
  if (!isActive(runtime) || record.pendingCommit) {
    return;
  }
  record.rosterCheckNeeded = false;
  const group = await ctx.api.getGroup(record.g, ownDeviceKey(ctx));
  if (group.epoch !== record.epoch) {
    record.rosterCheckNeeded = true;
    return;
  }
  const changes = await groupChanges(ctx, runtime, { onlyOwnAdds: true });
  const excluded = new Set(changes.strictRemovals);
  const leaves = record.members
    .map((member) => member.deviceKey)
    .filter((key) => !excluded.has(key));
  const server = new Set(
    group.roster.map((entry) => entry.device_key.toLowerCase())
  );
  const matches =
    leaves.length === server.size && leaves.every((key) => server.has(key));
  if (matches) {
    return;
  }
  const mls = requireMls(ctx);
  const signed = mls.signRoster(record.g, leaves);
  const digest = digestBytes(rosterDigest(record.g, signed.epoch, leaves));
  if (!mls.verifyEd25519(record.commitKey, digest, signed.signature)) {
    console.warn("E2EE: roster signature does not match the local digest");
  }
  try {
    await ctx.api.repairRoster(record.g, {
      epoch: signed.epoch,
      device_keys: leaves,
      requester_device_key: ownDeviceKey(ctx),
      signature: signed.signature,
    });
  } catch (error) {
    if (isNetworkish(error)) {
      record.rosterCheckNeeded = true;
    }
  }
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

export const otherAddDelayMs = (ctx: EngineContext): number =>
  OTHER_ADD_MIN_MS + Math.floor(ctx.random() * OTHER_ADD_SPAN_MS);

export const rosterDelayMs = (ctx: EngineContext): number =>
  Math.floor(ctx.random() * ROSTER_SPAN_MS);
