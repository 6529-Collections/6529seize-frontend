import { asE2eeApiError } from "../api";
import type {
  ApiE2eeGroup,
  ApiE2eeLogItem,
  ApiE2eeWelcome,
} from "../api-types";
import { MlsError } from "../mls-adapter";
import type { WasmWelcomeSummary } from "../wasm-types";
import { discardPendingCommit } from "./commit";
import {
  checkpoint,
  isActive,
  ownDeviceKey,
  requireMls,
  rollback,
  type EngineContext,
} from "./context";
import { RetryableError } from "./errors";
import {
  addNotices,
  applySummary,
  markGone,
  newGroupRecord,
  newRuntime,
  profileOfLeaf,
} from "./groups";
import { processLogItem } from "./process";
import type { GroupRuntime } from "./store";
import { isValidMetadata } from "./validate";

/** Log catch-up and Welcome inbox (contract 8.1 order, 4.2 windows). */

const LOG_PAGE_LIMIT = 200;

const isNetworkish = (error: unknown): boolean => {
  if (error instanceof RetryableError) {
    return true;
  }
  const apiError = asE2eeApiError(error);
  return apiError !== null && (apiError.status === 0 || apiError.status >= 500);
};

function rosterHasDevice(group: ApiE2eeGroup, deviceKey: string): boolean {
  return group.roster.some(
    (entry) => entry.device_key.toLowerCase() === deviceKey
  );
}

async function afterPage(
  ctx: EngineContext,
  runtime: GroupRuntime,
  group: ApiE2eeGroup,
  caughtUp: boolean
): Promise<void> {
  const record = runtime.record;
  if (!caughtUp || !isActive(runtime)) {
    return;
  }
  // Our commit was never sequenced if the server is still at its epoch.
  if (record.pendingCommit?.epoch === group.epoch) {
    await discardPendingCommit(ctx, runtime);
  }
  if (!rosterHasDevice(group, ownDeviceKey(ctx))) {
    await markGone(ctx, runtime, "removed");
  }
}

async function fetchPage(ctx: EngineContext, runtime: GroupRuntime) {
  try {
    return await ctx.api.getLog(runtime.record.g, {
      deviceKey: ownDeviceKey(ctx),
      afterSeq: runtime.record.cursor,
      limit: LOG_PAGE_LIMIT,
    });
  } catch (error) {
    const apiError = asE2eeApiError(error);
    if (apiError?.status === 404 && apiError.code === "E2EE_NOT_MEMBER") {
      await markGone(ctx, runtime, "removed");
      return null;
    }
    throw error;
  }
}

/** Applies one page of log items; checkpoints after every entry (8.7). */
async function processPage(
  ctx: EngineContext,
  runtime: GroupRuntime,
  items: readonly ApiE2eeLogItem[]
): Promise<boolean> {
  let changed = false;
  for (const item of items) {
    if (item.seq <= runtime.record.cursor) {
      continue;
    }
    try {
      await processLogItem(ctx, runtime, item);
    } catch (error) {
      await rollback(ctx);
      throw error;
    }
    runtime.record.cursor = item.seq;
    changed = true;
    const stillActive = isActive(runtime);
    if (item.type === "entry" || !stillActive) {
      await checkpoint(ctx, { groups: [runtime] });
    }
    if (!stillActive) {
      break;
    }
  }
  return changed;
}

/**
 * Processes the group's log strictly in seq order until caught up. Must run
 * inside the serial queue. Returns whether anything was processed.
 */
export async function catchUpGroup(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<boolean> {
  let changed = false;
  while (isActive(runtime)) {
    const page = await fetchPage(ctx, runtime);
    if (!page) {
      return true;
    }
    const pageChanged = await processPage(ctx, runtime, page.items);
    changed = changed || pageChanged;
    const next = page.next_after_seq;
    if (next !== null && next > runtime.record.cursor) {
      runtime.record.cursor = next;
    }
    if (pageChanged) {
      await checkpoint(ctx, { groups: [runtime] });
    }
    await afterPage(ctx, runtime, page.group, next === null);
    if (next === null) {
      break;
    }
  }
  return changed;
}

/** Catch-up wrapper that turns network failures into "try later". */
export async function tryCatchUp(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<boolean> {
  try {
    return await catchUpGroup(ctx, runtime);
  } catch (error) {
    if (isNetworkish(error)) {
      return false;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Welcomes
// ---------------------------------------------------------------------------

async function ack(ctx: EngineContext, welcome: ApiE2eeWelcome): Promise<void> {
  try {
    await ctx.api.ackWelcome(ownDeviceKey(ctx), welcome.id);
  } catch {
    // Retried with the next inbox pull.
  }
}

async function senderBlocked(
  ctx: EngineContext,
  profileIds: readonly (string | null)[]
): Promise<boolean> {
  const check = ctx.options.isBlocked;
  if (!check) {
    return false;
  }
  for (const profileId of profileIds) {
    if (
      profileId !== null &&
      profileId !== ctx.profileId &&
      (await check(profileId))
    ) {
      return true;
    }
  }
  return false;
}

/** 2.2/2.3 checks of every member; bad leaves become STRICT removals. */
async function checkWelcomeMembers(
  ctx: EngineContext,
  summary: WasmWelcomeSummary
): Promise<{ senderOk: boolean; badGrants: string[] }> {
  const now = ctx.now();
  const badGrants: string[] = [];
  let senderOk = false;
  const sender = summary.sender.device_key.toLowerCase();
  for (const leaf of summary.members) {
    const check = await ctx.directory.checkLeaf(leaf, now);
    const key = leaf.device_key.toLowerCase();
    if (key === sender) {
      senderOk = check.ok;
    }
    if (!check.ok && key !== ownDeviceKey(ctx)) {
      badGrants.push(key);
    }
  }
  return { senderOk, badGrants };
}

async function commitKeyMatches(
  ctx: EngineContext,
  summary: WasmWelcomeSummary
): Promise<boolean> {
  try {
    const group = await ctx.api.getGroup(summary.g, ownDeviceKey(ctx));
    return (
      group.epoch !== summary.epoch ||
      group.commit_key.toLowerCase() === summary.commit_key.toLowerCase()
    );
  } catch {
    return true;
  }
}

async function acceptJoin(
  ctx: EngineContext,
  welcome: ApiE2eeWelcome,
  staged: WasmWelcomeSummary,
  checks: {
    badGrants: string[];
    splitView: boolean;
    senderProfileId: string | null;
  }
): Promise<GroupRuntime> {
  const g = welcome.group.toLowerCase();
  const summary = requireMls(ctx).acceptWelcome(g);
  const now = ctx.now();
  const existing = ctx.store.groups.get(g);
  const record = newGroupRecord({
    summary,
    now,
    joinedAt: now,
    createdAt: welcome.created_at,
  });
  record.cursor = existing?.record.cursor ?? 0;
  record.readSeq = existing?.record.readSeq ?? 0;
  record.badGrants = checks.badGrants;
  record.splitView = checks.splitView;
  const runtime = existing ?? newRuntime(record);
  runtime.record = record;
  ctx.store.groups.set(g, runtime);
  await applySummary(ctx, runtime, summary);
  for (const member of record.members) {
    record.activity[member.deviceKey] = { at: now, known: false };
  }
  const senderKey = staged.sender.device_key.toLowerCase();
  record.activity[senderKey] = { at: welcome.created_at, known: true };
  const creation =
    welcome.epoch === 1 &&
    checks.senderProfileId === summary.metadata.created_by;
  addNotices(
    ctx,
    runtime,
    [
      {
        type: creation ? "created" : "joined",
        actorProfileId: checks.senderProfileId,
        targetProfileIds: [ctx.profileId],
      },
    ],
    record.cursor + 1,
    welcome.created_at
  );
  await checkpoint(ctx, { groups: [runtime] });
  return runtime;
}

/** Validates and joins one Welcome; returns the joined group, if any. */
async function handleWelcome(
  ctx: EngineContext,
  welcome: ApiE2eeWelcome
): Promise<GroupRuntime | null> {
  const mls = requireMls(ctx);
  const g = welcome.group.toLowerCase();
  const existing = ctx.store.groups.get(g);
  if (existing?.record.status === "active" && mls.hasGroup(g)) {
    await ack(ctx, welcome);
    return null;
  }
  if (await senderBlocked(ctx, [welcome.added_by_profile_id])) {
    await ack(ctx, welcome);
    return null;
  }
  let staged: WasmWelcomeSummary;
  try {
    staged = mls.joinWelcome(g, welcome.data, welcome.ratchet_tree);
  } catch (error) {
    if (!(error instanceof MlsError)) {
      throw error;
    }
    await ack(ctx, welcome);
    return null;
  }
  try {
    const metadataOk =
      isValidMetadata(staged.metadata) && staged.metadata.g.toLowerCase() === g;
    const checks = await checkWelcomeMembers(ctx, staged);
    const senderProfileId = await profileOfLeaf(ctx, staged.sender.device_key);
    const refused =
      !metadataOk ||
      !checks.senderOk ||
      (await senderBlocked(ctx, [senderProfileId]));
    if (refused) {
      mls.rejectWelcome(g);
      await checkpoint(ctx);
      await ack(ctx, welcome);
      return null;
    }
    const splitView = !(await commitKeyMatches(ctx, staged));
    const runtime = await acceptJoin(ctx, welcome, staged, {
      badGrants: checks.badGrants,
      splitView,
      senderProfileId,
    });
    await ack(ctx, welcome);
    return runtime;
  } catch (error) {
    await rollback(ctx);
    throw error;
  }
}

/** Pulls pending Welcomes (oldest first). Must run inside the queue. */
export async function processInbox(
  ctx: EngineContext
): Promise<GroupRuntime[]> {
  const welcomes = await ctx.api.getWelcomes(ownDeviceKey(ctx));
  const joined: GroupRuntime[] = [];
  for (const welcome of welcomes) {
    const runtime = await handleWelcome(ctx, welcome);
    if (runtime) {
      joined.push(runtime);
    }
  }
  return joined;
}
