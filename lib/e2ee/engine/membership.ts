import { asE2eeApiError } from "../api";
import type { ApiE2eePolicyStatus } from "../api-types";
import { randomHex } from "../bytes";
import type { E2eeEligibility } from "../types";
import type { GroupMetadata } from "../wasm-types";
import {
  claimedDevices,
  claimKeyPackages,
  isUsableDevice,
  type ClaimedPackage,
} from "./claims";
import {
  checkpoint,
  ownDeviceKey,
  requireActiveGroup,
  requireMls,
  type EngineContext,
} from "./context";
import { E2eeError } from "./errors";
import {
  addNotices,
  applySummary,
  markGone,
  newGroupRecord,
  newRuntime,
} from "./groups";
import {
  MAX_LEAVES_PER_COMMIT,
  runGroupCommit,
  type Planner,
} from "./maintenance";
import type { GroupRuntime } from "./store";
import { catchUpGroup } from "./sync";
import { trustedPackages } from "./trust";
import { MAX_GROUP_NAME } from "./validate";

/** Conversations: create, add/remove, rename, admins, leave (8.1 roles). */

const MAX_ELIGIBILITY = 100;

export async function checkEligibility(
  ctx: EngineContext,
  profileIds: string[]
): Promise<E2eeEligibility[]> {
  const unique = [...new Set(profileIds)];
  const out: E2eeEligibility[] = [];
  for (let offset = 0; offset < unique.length; offset += MAX_ELIGIBILITY) {
    const response = await ctx.api.checkEligibility({
      profile_ids: unique.slice(offset, offset + MAX_ELIGIBILITY),
    });
    for (const result of response.results) {
      out.push({
        profileId: result.profile_id,
        status: result.status,
        reason: result.reason ?? null,
      });
    }
  }
  return out;
}

const principalsOf = (runtime: GroupRuntime): Set<string> =>
  new Set(
    runtime.record.members
      .map((member) => member.profileId)
      .filter((id): id is string => id !== null)
  );

export function findDm(ctx: EngineContext, profileId: string): string | null {
  for (const runtime of ctx.store.groups.values()) {
    const record = runtime.record;
    if (record.status !== "active" || record.metadata.kind !== "dm") {
      continue;
    }
    const principals = principalsOf(runtime);
    const peers =
      principals.size > 1 ? principals : new Set(record.metadata.admins);
    if (peers.has(profileId) && peers.has(ctx.profileId) && peers.size === 2) {
      return record.g;
    }
  }
  return null;
}

function normalizeName(name: string | null | undefined): string | null {
  const trimmed = name?.trim() ?? "";
  if ([...trimmed].length > MAX_GROUP_NAME) {
    throw new E2eeError("E2EE_INVALID_INPUT", "name");
  }
  return trimmed.length > 0 ? trimmed : null;
}

const policyCode = (status: ApiE2eePolicyStatus) => {
  if (status === "BLOCKED") {
    return "E2EE_BLOCKED";
  }
  return status === "NO_DEVICES" ? "E2EE_NO_DEVICES" : "E2EE_POLICY";
};

/**
 * Keeps only trusted devices (engine/trust.ts); a person the server reported
 * as reachable whose devices are all untrusted counts as having none.
 */
async function trustedClaim(
  ctx: EngineContext,
  claim: {
    status: Map<string, ApiE2eePolicyStatus>;
    packages: ClaimedPackage[];
  }
): Promise<{
  status: Map<string, ApiE2eePolicyStatus>;
  packages: ClaimedPackage[];
}> {
  const packages = await trustedPackages(ctx, claim.packages);
  const status = new Map(claim.status);
  for (const [profileId, value] of status) {
    const reachable = packages.some(
      (item) => item.device.profile_id === profileId
    );
    if (value === "OK" && !reachable && profileId !== ctx.profileId) {
      status.set(profileId, "NO_DEVICES");
    }
  }
  return { status, packages };
}

/** Adds claimed KeyPackages in commits of at most 200 leaves (3.3). */
async function commitAdds(
  ctx: EngineContext,
  g: string,
  packages: readonly ClaimedPackage[],
  onDelayed: () => void
): Promise<string | null> {
  for (
    let offset = 0;
    offset < packages.length;
    offset += MAX_LEAVES_PER_COMMIT
  ) {
    const batch = packages.slice(offset, offset + MAX_LEAVES_PER_COMMIT);
    const planner: Planner = (runtime) => {
      const leaves = new Set(
        runtime.record.members.map((member) => member.deviceKey)
      );
      const remaining = batch.filter(
        (item) => !leaves.has(item.device.device_key.toLowerCase())
      );
      if (remaining.length === 0) {
        return null;
      }
      return {
        ops: { add_key_packages: remaining.map((item) => item.keyPackage) },
        claimed: claimedDevices(remaining),
      };
    };
    const run = await runGroupCommit(ctx, g, planner, onDelayed);
    if (run.kind === "rejected") {
      return run.code ?? "E2EE_COMMIT_FAILED";
    }
    if (run.kind === "delayed") {
      return "E2EE_COMMIT_DELAYED";
    }
  }
  return null;
}

async function ownSiblingDevices(ctx: EngineContext): Promise<string[]> {
  const own = ownDeviceKey(ctx);
  const out: string[] = [];
  for (const device of await ctx.directory.getProfileDevices(ctx.profileId)) {
    const key = device.device_key.toLowerCase();
    if (key !== own && (await isUsableDevice(ctx, device))) {
      out.push(key);
    }
  }
  return out;
}

async function createLocalGroup(
  ctx: EngineContext,
  metadata: GroupMetadata
): Promise<GroupRuntime> {
  return ctx.queue.run(async () => {
    const mls = requireMls(ctx);
    const summary = mls.createGroup(metadata.g, metadata);
    const now = ctx.now();
    const runtime = newRuntime(
      newGroupRecord({ summary, now, joinedAt: now, createdAt: now })
    );
    await applySummary(ctx, runtime, summary);
    await checkpoint(ctx, { groups: [runtime] });
    try {
      await ctx.api.createGroup({
        group: metadata.g,
        commit_key: summary.commit_key,
        creator_device_key: ownDeviceKey(ctx),
      });
    } catch (error) {
      mls.deleteGroup(metadata.g);
      await checkpoint(ctx, { deleteGroups: [metadata.g] });
      throw error;
    }
    runtime.record.activity[ownDeviceKey(ctx)] = { at: now, known: true };
    ctx.store.groups.set(metadata.g, runtime);
    await checkpoint(ctx, { groups: [runtime], skipWasm: true });
    ctx.store.touch(metadata.g);
    return runtime;
  });
}

async function discardLocalGroup(ctx: EngineContext, g: string): Promise<void> {
  await ctx.queue.run(async () => {
    if (ctx.mls?.hasGroup(g) === true) {
      ctx.mls.deleteGroup(g);
    }
    ctx.store.groups.delete(g);
    await checkpoint(ctx, { deleteGroups: [g] });
    ctx.store.touch();
  });
}

function creationMetadata(
  ctx: EngineContext,
  input: { kind: "dm" | "group"; name?: string | null | undefined },
  peer: string | undefined
): GroupMetadata {
  const dm = input.kind === "dm";
  return {
    v: 1,
    g: randomHex(32),
    kind: input.kind,
    name: dm ? null : normalizeName(input.name),
    admins: dm && peer !== undefined ? [ctx.profileId, peer] : [ctx.profileId],
    created_by: ctx.profileId,
    history: "from_join",
  };
}

/** Claims every target's KeyPackages (plus our siblings') before creating. */
async function claimForCreation(
  ctx: EngineContext,
  targets: string[],
  kind: "dm" | "group"
): Promise<ClaimedPackage[]> {
  const siblings = await ownSiblingDevices(ctx);
  const claim = await trustedClaim(
    ctx,
    await claimKeyPackages(ctx, [
      ...targets.map((profile_id) => ({ profile_id })),
      ...(siblings.length > 0
        ? [{ profile_id: ctx.profileId, device_keys: siblings }]
        : []),
    ])
  );
  const statuses = targets.map((id) => claim.status.get(id) ?? "NO_DEVICES");
  const refused = statuses.find((status) => status !== "OK");
  const allRefused =
    statuses.length > 0 && statuses.every((status) => status !== "OK");
  if (refused && (kind === "dm" || allRefused)) {
    throw new E2eeError(policyCode(refused));
  }
  return claim.packages;
}

export async function createConversation(
  ctx: EngineContext,
  input: { profileIds: string[]; kind: "dm" | "group"; name?: string | null },
  onDelayed: (g: string) => void
): Promise<string> {
  const targets = [...new Set(input.profileIds)].filter(
    (id) => id !== ctx.profileId
  );
  const peer = targets[0];
  if (input.kind === "dm") {
    if (targets.length !== 1 || peer === undefined) {
      throw new E2eeError("E2EE_DM_TARGET");
    }
    const existing = findDm(ctx, peer);
    if (existing) {
      return existing;
    }
  }
  const metadata = creationMetadata(ctx, input, peer);
  const g = metadata.g;
  const packages = await claimForCreation(ctx, targets, input.kind);
  const runtime = await createLocalGroup(ctx, metadata);
  const failure = await commitAdds(ctx, g, packages, () => {
    onDelayed(g);
  });
  const fatal = failure !== null && failure !== "E2EE_COMMIT_DELAYED";
  if (fatal && runtime.record.epoch === 0) {
    await discardLocalGroup(ctx, g);
    throw new E2eeError(
      failure === "E2EE_BLOCKED" ? "E2EE_BLOCKED" : "E2EE_POLICY",
      failure
    );
  }
  return g;
}

function requireAdmin(ctx: EngineContext, runtime: GroupRuntime): void {
  if (!runtime.record.metadata.admins.includes(ctx.profileId)) {
    throw new E2eeError("E2EE_NOT_ADMIN");
  }
}

function requireGroupKind(runtime: GroupRuntime): void {
  if (runtime.record.metadata.kind !== "group") {
    throw new E2eeError("E2EE_NOT_ALLOWED");
  }
}

export async function addMembers(
  ctx: EngineContext,
  g: string,
  profileIds: string[],
  onDelayed: () => void
): Promise<E2eeEligibility[]> {
  const runtime = requireActiveGroup(ctx, g);
  requireGroupKind(runtime);
  requireAdmin(ctx, runtime);
  const existing = principalsOf(runtime);
  const fresh = [...new Set(profileIds)].filter(
    (id) => id !== ctx.profileId && !existing.has(id)
  );
  const claim =
    fresh.length > 0
      ? await trustedClaim(
          ctx,
          await claimKeyPackages(
            ctx,
            fresh.map((profile_id) => ({ profile_id })),
            runtime.record.g
          )
        )
      : null;
  const failure = claim
    ? await commitAdds(ctx, runtime.record.g, claim.packages, onDelayed)
    : null;
  return [...new Set(profileIds)].map((profileId) => {
    let status: ApiE2eePolicyStatus = claim?.status.get(profileId) ?? "OK";
    if (
      status === "OK" &&
      failure === "E2EE_BLOCKED" &&
      fresh.includes(profileId)
    ) {
      status = "BLOCKED";
    } else if (
      status === "OK" &&
      failure === "E2EE_POLICY" &&
      fresh.includes(profileId)
    ) {
      status = "POLICY";
    }
    return { profileId, status };
  });
}

async function commitOrThrow(
  ctx: EngineContext,
  g: string,
  planner: Planner,
  onDelayed: () => void
): Promise<void> {
  const run = await runGroupCommit(ctx, g, planner, onDelayed);
  if (run.kind === "rejected") {
    throw new E2eeError("E2EE_COMMIT_FAILED", run.code ?? undefined);
  }
}

export async function removeMember(
  ctx: EngineContext,
  g: string,
  profileId: string,
  onDelayed: () => void
): Promise<void> {
  const runtime = requireActiveGroup(ctx, g);
  if (profileId === ctx.profileId) {
    throw new E2eeError("E2EE_NOT_ALLOWED");
  }
  requireAdmin(ctx, runtime);
  await commitOrThrow(
    ctx,
    runtime.record.g,
    (current) => {
      const keys = current.record.members
        .filter((member) => member.profileId === profileId)
        .map((member) => member.deviceKey);
      return keys.length > 0
        ? { ops: { remove_device_keys: keys }, claimed: new Map() }
        : null;
    },
    onDelayed
  );
}

function metadataPlanner(
  change: (metadata: GroupMetadata) => GroupMetadata | null
): Planner {
  return (runtime) => {
    const next = change(runtime.record.metadata);
    return next ? { ops: { metadata: next }, claimed: new Map() } : null;
  };
}

export async function rename(
  ctx: EngineContext,
  g: string,
  name: string,
  onDelayed: () => void
): Promise<void> {
  const runtime = requireActiveGroup(ctx, g);
  requireGroupKind(runtime);
  requireAdmin(ctx, runtime);
  const next = normalizeName(name);
  await commitOrThrow(
    ctx,
    runtime.record.g,
    metadataPlanner((meta) =>
      meta.name === next ? null : { ...meta, name: next }
    ),
    onDelayed
  );
}

export async function setAdmin(
  ctx: EngineContext,
  g: string,
  profileId: string,
  admin: boolean,
  onDelayed: () => void
): Promise<void> {
  const runtime = requireActiveGroup(ctx, g);
  requireGroupKind(runtime);
  requireAdmin(ctx, runtime);
  if (admin && !principalsOf(runtime).has(profileId)) {
    throw new E2eeError("E2EE_INVALID_INPUT", "not-a-member");
  }
  await commitOrThrow(
    ctx,
    runtime.record.g,
    metadataPlanner((meta) => {
      const has = meta.admins.includes(profileId);
      if (has === admin) {
        return null;
      }
      const admins = admin
        ? [...meta.admins, profileId]
        : meta.admins.filter((id) => id !== profileId);
      if (admins.length === 0) {
        throw new E2eeError("E2EE_NOT_ALLOWED", "last-admin");
      }
      return { ...meta, admins };
    }),
    onDelayed
  );
}

/** A sole admin hands admin to another member before leaving a group. */
async function handOverAdmin(
  ctx: EngineContext,
  runtime: GroupRuntime,
  onDelayed: () => void
): Promise<void> {
  const meta = runtime.record.metadata;
  const others = [...principalsOf(runtime)].filter(
    (id) => id !== ctx.profileId
  );
  const remainingAdmins = meta.admins.filter(
    (id) => id !== ctx.profileId && others.includes(id)
  );
  if (
    meta.kind !== "group" ||
    !meta.admins.includes(ctx.profileId) ||
    others.length === 0 ||
    remainingAdmins.length > 0
  ) {
    return;
  }
  const heir = others.includes(meta.created_by)
    ? meta.created_by
    : [...others].sort((a, b) => a.localeCompare(b))[0];
  if (heir === undefined) {
    return;
  }
  await runGroupCommit(
    ctx,
    runtime.record.g,
    metadataPlanner((current) =>
      current.admins.includes(heir)
        ? null
        : { ...current, admins: [...current.admins, heir] }
    ),
    onDelayed
  );
}

async function proposeLeave(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<boolean> {
  return ctx.queue.run(async () => {
    await catchUpGroup(ctx, runtime);
    if (runtime.record.status !== "active") {
      return true;
    }
    const mls = requireMls(ctx);
    const keys = runtime.record.members
      .filter((member) => member.profileId === ctx.profileId)
      .map((member) => member.deviceKey);
    const entries = mls.proposeRemove(runtime.record.g, keys);
    await checkpoint(ctx, { groups: [runtime] });
    try {
      for (const [index, entry] of entries.entries()) {
        await ctx.api.submitEntry(runtime.record.g, {
          kind: "proposal",
          epoch: entry.epoch,
          data: entry.data,
          entry_hash: entry.entry_hash,
          epoch_commitment: entry.epoch_commitment,
          next_commit_key: entry.next_commit_key,
          signature: entry.signature,
          sender_device_key: ownDeviceKey(ctx),
          roster_remove: [keys[index] ?? ownDeviceKey(ctx)],
        });
      }
    } catch (error) {
      const code = asE2eeApiError(error)?.code;
      if (code === "E2EE_EPOCH_STALE" || code === "E2EE_EPOCH_CONFLICT") {
        return false;
      }
      throw error;
    }
    addNotices(
      ctx,
      runtime,
      [
        {
          type: "left",
          actorProfileId: ctx.profileId,
          targetProfileIds: [ctx.profileId],
        },
      ],
      runtime.record.cursor + 1,
      ctx.now()
    );
    await markGone(ctx, runtime, "left");
    return true;
  });
}

export async function leave(
  ctx: EngineContext,
  g: string,
  onDelayed: () => void
): Promise<void> {
  const runtime = requireActiveGroup(ctx, g);
  await handOverAdmin(ctx, runtime, onDelayed);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await proposeLeave(ctx, runtime)) {
      return;
    }
  }
  throw new E2eeError("E2EE_COMMIT_FAILED", "leave");
}

export function restartTargets(
  ctx: EngineContext,
  runtime: GroupRuntime
): string[] {
  const principals = principalsOf(runtime);
  if (runtime.record.metadata.kind === "dm") {
    for (const admin of runtime.record.metadata.admins) {
      principals.add(admin);
    }
  }
  principals.delete(ctx.profileId);
  return [...principals];
}
