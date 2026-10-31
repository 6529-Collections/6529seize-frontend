import { asE2eeApiError } from "../api";
import type { ApiE2eeDevice, ApiE2eeSubmitEntryRequest } from "../api-types";
import { credentialIdentity } from "../grant";
import type { PendingCommitRecord } from "../records";
import type {
  WasmCommitOps,
  WasmCommitResult,
  WasmGroupSummary,
} from "../wasm-types";
import {
  checkpoint,
  ownDeviceKey,
  requireMls,
  type EngineContext,
} from "./context";
import { E2eeError } from "./errors";
import {
  addNotices,
  applySummary,
  leafRefs,
  memberRefs,
  touchActivity,
} from "./groups";
import { credentialWallets, deriveCommitNotices } from "./notices";
import type { GroupRuntime } from "./store";

/** Own commits: persist before submit, merge on 200, discard on 409 (8.7). */

export interface CommitIntent {
  ops: WasmCommitOps;
  /** device_key -> device record of every KeyPackage being added. */
  claimed: ReadonlyMap<string, ApiE2eeDevice>;
}

export type CommitOutcome =
  | { kind: "ok"; seq: number }
  | { kind: "conflict" }
  | { kind: "failed" }
  | { kind: "rejected"; code: string | null };

function verifyAddedLeaves(
  result: WasmCommitResult,
  claimed: ReadonlyMap<string, ApiE2eeDevice>
): boolean {
  return result.added.every((leaf) => {
    const record = claimed.get(leaf.device_key.toLowerCase());
    return (
      record !== undefined &&
      leaf.identity === credentialIdentity(record.grant.wallet, record.grant_id)
    );
  });
}

function pendingRecord(
  ctx: EngineContext,
  result: WasmCommitResult,
  ops: WasmCommitOps
): PendingCommitRecord {
  return {
    epoch: result.entry.epoch,
    entryHash: result.entry.entry_hash.toLowerCase(),
    added: result.added,
    removed: result.removed,
    metadataAfter: ops.metadata ?? null,
    selfUpdate: ops.self_update === true || result.removed.length > 0,
    newEpochFp: result.new_epoch_fp,
    createdAt: ctx.now(),
  };
}

function entryRequest(
  ctx: EngineContext,
  result: WasmCommitResult
): ApiE2eeSubmitEntryRequest {
  const added = result.added.map((leaf) => leaf.device_key.toLowerCase());
  const removed = result.removed.map((leaf) => leaf.device_key.toLowerCase());
  const body: ApiE2eeSubmitEntryRequest = {
    kind: "commit",
    epoch: result.entry.epoch,
    data: result.entry.data,
    entry_hash: result.entry.entry_hash,
    epoch_commitment: result.entry.epoch_commitment,
    next_commit_key: result.entry.next_commit_key,
    signature: result.entry.signature,
    sender_device_key: ownDeviceKey(ctx),
    roster_add: added,
    roster_remove: removed,
  };
  if (result.welcome && added.length > 0) {
    body.welcome = {
      data: result.welcome,
      targets: added,
      ...(result.ratchet_tree ? { ratchet_tree: result.ratchet_tree } : {}),
    };
  }
  return body;
}

/**
 * Applies a merged own commit to the record: notices, activity, self-update
 * bookkeeping. Used after a 200 and when the log shows our pending entry.
 */
export async function finalizeOwnCommit(
  ctx: EngineContext,
  runtime: GroupRuntime,
  input: {
    pending: PendingCommitRecord;
    summary: WasmGroupSummary;
    seq: number;
    serverTs: number;
  }
): Promise<void> {
  const record = runtime.record;
  const metadataBefore = record.metadata;
  const membersBefore = memberRefs(record);
  const added = await leafRefs(ctx, input.pending.added);
  const removed = await leafRefs(ctx, input.pending.removed);
  const notices = deriveCommitNotices({
    committerProfileId: ctx.profileId,
    membersBefore,
    added,
    removed,
    metadataBefore,
    metadataAfter: input.summary.metadata,
    leaving: new Set(record.leaving),
    creation:
      input.pending.epoch === 0 && metadataBefore.created_by === ctx.profileId,
    addedWallets: credentialWallets(input.pending.added),
  });
  record.pendingCommit = null;
  touchActivity(
    record,
    [ownDeviceKey(ctx), ...added.map((member) => member.deviceKey)],
    input.serverTs
  );
  if (input.pending.selfUpdate) {
    record.lastSelfUpdateAt = ctx.now();
    record.selfUpdateRequested = false;
  }
  record.rosterCheckNeeded = true;
  await applySummary(ctx, runtime, input.summary);
  addNotices(ctx, runtime, notices, input.seq, input.serverTs);
}

const isUnknownOutcome = (status: number): boolean =>
  status === 0 || status >= 500 || status === 429;

/**
 * Creates, persists and submits one commit for the group's current epoch.
 * Must run inside the serial queue with the log caught up.
 */
export async function submitCommit(
  ctx: EngineContext,
  runtime: GroupRuntime,
  intent: CommitIntent
): Promise<CommitOutcome> {
  const mls = requireMls(ctx);
  const g = runtime.record.g;
  if (runtime.record.pendingCommit) {
    return { kind: "failed" };
  }
  const result = mls.createCommit(g, intent.ops);
  if (!verifyAddedLeaves(result, intent.claimed)) {
    mls.discardPending(g);
    throw new E2eeError("E2EE_DEVICE_MISMATCH");
  }
  const pending = pendingRecord(ctx, result, intent.ops);
  runtime.record.pendingCommit = pending;
  await checkpoint(ctx, { groups: [runtime] });
  try {
    const item = await ctx.api.submitEntry(g, entryRequest(ctx, result));
    const summary = mls.mergePending(g);
    await finalizeOwnCommit(ctx, runtime, {
      pending,
      summary,
      seq: item.seq,
      serverTs: item.created_at,
    });
    await checkpoint(ctx, { groups: [runtime] });
    return { kind: "ok", seq: item.seq };
  } catch (error) {
    const apiError = asE2eeApiError(error);
    if (apiError && isUnknownOutcome(apiError.status)) {
      // Outcome unknown: keep the pending commit; the log resolves it.
      return { kind: "failed" };
    }
    if (!apiError) {
      throw error;
    }
    mls.discardPending(g);
    runtime.record.pendingCommit = null;
    await checkpoint(ctx, { groups: [runtime] });
    const conflict =
      apiError.code === "E2EE_EPOCH_CONFLICT" ||
      apiError.code === "E2EE_EPOCH_STALE";
    return conflict
      ? { kind: "conflict" }
      : { kind: "rejected", code: apiError.code };
  }
}

/** Drops an unresolved pending commit once the server is known not to hold it. */
export async function discardPendingCommit(
  ctx: EngineContext,
  runtime: GroupRuntime
): Promise<void> {
  if (!runtime.record.pendingCommit) {
    return;
  }
  requireMls(ctx).discardPending(runtime.record.g);
  runtime.record.pendingCommit = null;
  await checkpoint(ctx, { groups: [runtime] });
}
