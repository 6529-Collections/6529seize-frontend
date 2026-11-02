import type {
  LeafActivity,
  StoredGroup,
  StoredMember,
  StoredNotice,
} from "../records";
import type { WasmGroupSummary, WasmLeaf } from "../wasm-types";
import { checkpoint, type EngineContext } from "./context";
import { collapsibleSafetyNotice, noticeMessage } from "./notices";
import type { MemberRef } from "./required-changes";
import { compareMessages, type GroupRuntime } from "./store";

/** Group record helpers shared by sync, commits and membership changes. */

const MAX_EPOCH_FPS = 8;

export function newRuntime(record: StoredGroup): GroupRuntime {
  return {
    record,
    messages: new Map(),
    dirty: new Set(),
    deleted: new Set(),
    outbox: new Map(),
    stallSince: null,
  };
}

export function newGroupRecord(input: {
  summary: WasmGroupSummary;
  now: number;
  joinedAt: number;
  createdAt: number;
}): StoredGroup {
  const { summary } = input;
  return {
    g: summary.g.toLowerCase(),
    status: "active",
    metadata: summary.metadata,
    cursor: 0,
    epoch: summary.epoch,
    epochFp: summary.epoch_fp,
    epochFps: { [String(summary.epoch)]: summary.epoch_fp },
    commitKey: summary.commit_key,
    members: summary.members.map((leaf) => ({
      deviceKey: leaf.device_key.toLowerCase(),
      profileId: null,
      leaf: leaf.leaf,
      identity: leaf.identity,
    })),
    splitView: false,
    invalidReason: null,
    delayed: false,
    leaving: [],
    badGrants: [],
    activity: {},
    lastSelfUpdateAt: input.joinedAt,
    selfUpdateRequested: false,
    rosterCheckNeeded: false,
    sentSeqs: [],
    readSeq: 0,
    createdAt: input.createdAt,
    joinedAt: input.joinedAt,
    updatedAt: input.now,
    pendingCommit: null,
  };
}

export const memberRefs = (record: StoredGroup): MemberRef[] =>
  record.members.map((member) => ({
    deviceKey: member.deviceKey,
    profileId: member.profileId,
  }));

/** Resolves the profile of a leaf from the device directory (best effort). */
export async function profileOfLeaf(
  ctx: EngineContext,
  deviceKey: string
): Promise<string | null> {
  const cached = ctx.directory.profileOf(deviceKey);
  if (cached !== null) {
    return cached;
  }
  try {
    const record = await ctx.directory.getDevice(deviceKey);
    return record?.profile_id ?? null;
  } catch {
    return null;
  }
}

export async function leafRefs(
  ctx: EngineContext,
  leaves: readonly WasmLeaf[]
): Promise<MemberRef[]> {
  const out: MemberRef[] = [];
  for (const leaf of leaves) {
    const deviceKey = leaf.device_key.toLowerCase();
    out.push({ deviceKey, profileId: await profileOfLeaf(ctx, deviceKey) });
  }
  return out;
}

/** Mirrors a GroupSummary into the record (members, epoch, fp, metadata). */
export async function applySummary(
  ctx: EngineContext,
  runtime: GroupRuntime,
  summary: WasmGroupSummary
): Promise<void> {
  const record = runtime.record;
  const members: StoredMember[] = [];
  for (const leaf of summary.members) {
    const deviceKey = leaf.device_key.toLowerCase();
    members.push({
      deviceKey,
      profileId: await profileOfLeaf(ctx, deviceKey),
      leaf: leaf.leaf,
      identity: leaf.identity,
    });
  }
  record.members = members;
  record.epoch = summary.epoch;
  record.epochFp = summary.epoch_fp;
  record.commitKey = summary.commit_key;
  record.metadata = summary.metadata;
  const fps = { ...record.epochFps, [String(summary.epoch)]: summary.epoch_fp };
  const keep = Object.keys(fps)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, MAX_EPOCH_FPS);
  record.epochFps = Object.fromEntries(
    keep.map((epoch) => [String(epoch), fps[String(epoch)] ?? ""])
  );
  const leafKeys = new Set(members.map((member) => member.deviceKey));
  record.leaving = record.leaving.filter((key) => leafKeys.has(key));
  record.badGrants = record.badGrants.filter((key) => leafKeys.has(key));
  const activity: Record<string, LeafActivity> = {};
  for (const key of leafKeys) {
    const entry = record.activity[key];
    if (entry) {
      activity[key] = entry;
    }
  }
  record.activity = activity;
  ctx.store.touch(record.g);
}

export function touchActivity(
  record: StoredGroup,
  deviceKeys: readonly string[],
  at: number
): void {
  for (const key of deviceKeys) {
    record.activity[key.toLowerCase()] = { at, known: true };
  }
}

/**
 * Appends notices for the entry at `seq`, collapsing key-only updates, and
 * invalidates the timeline snapshot: callers add notices after
 * `applySummary`, whose store notification may already have re-cached the
 * timeline without them.
 */
export function addNotices(
  ctx: EngineContext,
  runtime: GroupRuntime,
  notices: readonly StoredNotice[],
  seq: number,
  serverTs: number
): void {
  const onlySafety =
    notices.length === 1 && notices[0]?.type === "safety_code_changed";
  if (onlySafety) {
    const ordered = [...runtime.messages.values()].sort(compareMessages);
    const replace = collapsibleSafetyNotice(ordered.filter((m) => !m.pending));
    if (replace) {
      runtime.messages.delete(replace);
      runtime.dirty.delete(replace);
      runtime.deleted.add(replace);
    }
  }
  notices.forEach((notice, index) => {
    const message = noticeMessage({
      g: runtime.record.g,
      seq,
      index,
      serverTs,
      notice,
    });
    runtime.messages.set(message.id, message);
    runtime.dirty.add(message.id);
  });
  runtime.record.updatedAt = Math.max(runtime.record.updatedAt, serverTs);
  ctx.store.touch(runtime.record.g);
}

export function markInvalid(
  ctx: EngineContext,
  runtime: GroupRuntime,
  reason: string,
  splitView: boolean
): void {
  runtime.record.status = "invalid";
  runtime.record.invalidReason = reason;
  runtime.record.splitView = runtime.record.splitView || splitView;
  ctx.store.touch(runtime.record.g);
}

/** Ends local participation: MLS state is deleted, the timeline is kept. */
export async function markGone(
  ctx: EngineContext,
  runtime: GroupRuntime,
  status: "left" | "removed"
): Promise<void> {
  const g = runtime.record.g;
  if (ctx.mls?.hasGroup(g) === true) {
    ctx.mls.deleteGroup(g);
  }
  runtime.record.status = status;
  runtime.record.pendingCommit = null;
  runtime.record.delayed = false;
  ctx.store.touch(g);
  await checkpoint(ctx, { groups: [runtime] });
}
