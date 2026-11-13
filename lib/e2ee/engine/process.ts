import { preparePayload, loadMessage } from "./history";
import type { ApiE2eeLogItem } from "../api-types";
import { base64ToBytes } from "../bytes";
import { parseCredentialIdentity } from "../grant";
import { MlsError } from "../mls-adapter";
import { decodePayload } from "../payload";
import type { WasmProposalSummary, WasmStagedSummary } from "../wasm-types";
import { finalizeOwnCommit } from "./commit";
import { ownDeviceKey, requireMls, type EngineContext } from "./context";
import { RetryableError } from "./errors";
import {
  addNotices,
  applySummary,
  leafRefs,
  markGone,
  markInvalid,
  memberRefs,
  profileOfLeaf,
  touchActivity,
} from "./groups";
import { applyPayload, placeholderMessage, undecryptableId } from "./messages";
import { credentialWallets, deriveCommitNotices } from "./notices";
import { isStrictRemoval, mayBeIdle, type MemberRef } from "./required-changes";
import type { GroupRuntime } from "./store";
import { isTrustedMemberDevice } from "./trust";
import { validateCommit, type AddedLeafRef } from "./validate";

/** Contract 8.1: processing one log item in seq order. */

/** Item fields the WASM needs (it unwraps with wrapE_n / wrapM_n). */
const wasmItem = (item: ApiE2eeLogItem) => ({
  seq: item.seq,
  type: item.type,
  epoch: item.epoch,
  kind: item.kind,
  data: item.data,
  entry_hash: item.entry_hash,
  epoch_commitment: item.epoch_commitment,
  next_commit_key: item.next_commit_key,
  signature: item.signature,
  epoch_fp: item.epoch_fp,
});

async function prefetchDevices(
  ctx: EngineContext,
  deviceKeys: readonly string[]
): Promise<void> {
  for (const key of deviceKeys) {
    await ctx.directory.getDevice(key);
  }
}

/** 8.2 required-removal status of `deviceKey` when the entry was made. */
async function requiredRemovalAt(
  ctx: EngineContext,
  runtime: GroupRuntime,
  deviceKey: string,
  atMs: number
): Promise<boolean> {
  const record = runtime.record;
  const leaving = new Set(record.leaving);
  const badGrants = new Set(record.badGrants);
  const device = await ctx.directory.getDevice(deviceKey);
  const revoked =
    device !== null &&
    device.revoked_at !== null &&
    (await ctx.directory.revocationState(device)) === "verified";
  const status = new Map([
    [
      deviceKey,
      {
        revoked,
        expiresAt: device ? device.grant.expires_at * 1000 : null,
        badGrant: device === null,
      },
    ],
  ]);
  if (
    isStrictRemoval(deviceKey, {
      now: atMs,
      leaving,
      badGrants,
      deviceStatus: status,
    })
  ) {
    return true;
  }
  return mayBeIdle(record.activity[deviceKey], atMs);
}

async function requiredRemovals(
  ctx: EngineContext,
  runtime: GroupRuntime,
  removed: readonly MemberRef[],
  committer: MemberRef,
  atMs: number
): Promise<Set<string>> {
  const out = new Set<string>();
  for (const leaf of removed) {
    const own =
      leaf.profileId !== null && leaf.profileId === committer.profileId;
    if (!own && (await requiredRemovalAt(ctx, runtime, leaf.deviceKey, atMs))) {
      out.add(leaf.deviceKey);
    }
  }
  return out;
}

/** profile id -> wallets in the credentials of its current leaves. */
function leafWallets(runtime: GroupRuntime): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const member of runtime.record.members) {
    const wallet = parseCredentialIdentity(member.identity)?.wallet;
    if (member.profileId === null || !wallet) {
      continue;
    }
    const wallets = out.get(member.profileId) ?? new Set<string>();
    wallets.add(wallet);
    out.set(member.profileId, wallets);
  }
  return out;
}

/**
 * Checks the added leaves (2.3) and notes which acceptable ones this device
 * has not verified for their owner: a grant not verified here, or a wallet
 * not trusted for that person here. Such adds are accepted as before (the
 * rules every client applies are unchanged) and only marked for the notice.
 */
async function checkAddedLeaves(
  ctx: EngineContext,
  runtime: GroupRuntime,
  staged: WasmStagedSummary,
  atMs: number
): Promise<{ added: AddedLeafRef[]; unverified: Set<string> }> {
  const added: AddedLeafRef[] = [];
  const unverified = new Set<string>();
  const wallets = leafWallets(runtime);
  for (const leaf of staged.added) {
    const check = await ctx.directory.checkLeaf(leaf, atMs);
    const deviceKey = leaf.device_key.toLowerCase();
    added.push({ deviceKey, profileId: check.profileId, ok: check.ok });
    if (!check.ok || check.profileId === null || !check.record) {
      continue;
    }
    const trusted = isTrustedMemberDevice(
      ctx,
      {
        profileId: check.profileId,
        deviceKey,
        wallet: check.record.grant.wallet,
      },
      wallets.get(check.profileId) ?? new Set()
    );
    if (!trusted || check.verification?.verified !== true) {
      unverified.add(deviceKey);
    }
  }
  return { added, unverified };
}

const sameKeys = (
  left: readonly string[],
  right: readonly string[]
): boolean => {
  const a = new Set(left.map((key) => key.toLowerCase()));
  const b = new Set(right.map((key) => key.toLowerCase()));
  return a.size === b.size && [...a].every((key) => b.has(key));
};

function noteSiblingRemoval(
  ctx: EngineContext,
  runtime: GroupRuntime,
  removed: readonly MemberRef[]
): void {
  const own = ownDeviceKey(ctx);
  if (
    removed.some(
      (leaf) => leaf.profileId === ctx.profileId && leaf.deviceKey !== own
    )
  ) {
    runtime.record.selfUpdateRequested = true;
  }
}

/**
 * The committer's leaf after an update path (credential renewal, 8.8) keeps
 * its signature key and must carry a valid credential.
 */
async function senderLeafOk(
  ctx: EngineContext,
  staged: WasmStagedSummary,
  atMs: number
): Promise<boolean> {
  const after = staged.sender_leaf_after;
  if (!after) {
    return true;
  }
  if (
    after.device_key.toLowerCase() !== staged.sender.device_key.toLowerCase()
  ) {
    return false;
  }
  if (after.identity === staged.sender.identity) {
    return true;
  }
  return (await ctx.directory.checkLeaf(after, atMs)).ok;
}

async function handleStagedCommit(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: ApiE2eeLogItem,
  staged: WasmStagedSummary
): Promise<void> {
  const mls = requireMls(ctx);
  const record = runtime.record;
  const g = record.g;
  let added: AddedLeafRef[];
  let unverifiedAdds: Set<string>;
  let removed: MemberRef[];
  let committer: MemberRef;
  let required: Set<string>;
  let senderOk: boolean;
  try {
    committer = {
      deviceKey: staged.sender.device_key.toLowerCase(),
      profileId: await profileOfLeaf(ctx, staged.sender.device_key),
    };
    ({ added, unverified: unverifiedAdds } = await checkAddedLeaves(
      ctx,
      runtime,
      staged,
      item.created_at
    ));
    removed = await leafRefs(ctx, staged.removed);
    required = await requiredRemovals(
      ctx,
      runtime,
      removed,
      committer,
      item.created_at
    );
    senderOk = await senderLeafOk(ctx, staged, item.created_at);
  } catch (error) {
    mls.rejectStaged(g);
    throw error instanceof RetryableError
      ? error
      : new RetryableError("validation");
  }
  const membersBefore = memberRefs(record);
  if (!senderOk) {
    mls.rejectStaged(g);
    markInvalid(ctx, runtime, "bad-sender-leaf", false);
    return;
  }
  const validation = validateCommit({
    entryEpoch: item.epoch,
    committer,
    membersBefore,
    added,
    removed,
    metadataBefore: staged.metadata_before,
    metadataAfter: staged.metadata_after,
    declaredOk: staged.self_removed || staged.declared_ok === true,
    isRequiredRemoval: (key) => required.has(key),
  });
  if (!validation.ok) {
    mls.rejectStaged(g);
    markInvalid(ctx, runtime, validation.reason, validation.splitView);
    return;
  }
  const summary = mls.acceptStaged(g);
  if (staged.self_removed) {
    addNotices(
      ctx,
      runtime,
      [
        {
          type: "removed",
          actorProfileId: committer.profileId,
          targetProfileIds: [ctx.profileId],
        },
      ],
      item.seq,
      item.created_at
    );
    await markGone(ctx, runtime, "removed");
    return;
  }
  const notices = deriveCommitNotices({
    committerProfileId: committer.profileId,
    membersBefore,
    added,
    removed,
    metadataBefore: staged.metadata_before,
    metadataAfter: staged.metadata_after,
    leaving: new Set(record.leaving),
    creation:
      item.epoch === 0 &&
      committer.profileId === staged.metadata_before.created_by,
    addedWallets: credentialWallets(staged.added),
    unverifiedAdds,
  });
  touchActivity(
    record,
    [committer.deviceKey, ...added.map((leaf) => leaf.deviceKey)],
    item.created_at
  );
  noteSiblingRemoval(ctx, runtime, removed);
  const declaredRoster =
    sameKeys(
      item.roster_add,
      added.map((leaf) => leaf.deviceKey)
    ) &&
    sameKeys(
      item.roster_remove,
      removed.map((leaf) => leaf.deviceKey)
    );
  if (!declaredRoster) {
    record.rosterCheckNeeded = true;
  }
  await applySummary(ctx, runtime, summary);
  addNotices(ctx, runtime, notices, item.seq, item.created_at);
}

async function handleProposal(
  ctx: EngineContext,
  runtime: GroupRuntime,
  proposal: WasmProposalSummary
): Promise<void> {
  if (!proposal.remove) {
    return;
  }
  const proposer = await profileOfLeaf(ctx, proposal.sender.device_key);
  const target = await profileOfLeaf(ctx, proposal.remove.device_key);
  const removeKey = proposal.remove.device_key.toLowerCase();
  // 8.1.2: only a Remove of a leaf of the proposer's own principal (leave).
  if (proposer === null || proposer !== target) {
    requireMls(ctx).dropProposals(runtime.record.g, removeKey);
    console.warn("E2EE: ignored a proposal that is not a leave");
    return;
  }
  if (!runtime.record.leaving.includes(removeKey)) {
    runtime.record.leaving.push(removeKey);
  }
  ctx.store.touch(runtime.record.g);
}

async function resolvePendingFromLog(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: ApiE2eeLogItem
): Promise<boolean> {
  const pending = runtime.record.pendingCommit;
  if (!pending) {
    return false;
  }
  const mls = requireMls(ctx);
  if (pending.entryHash === item.entry_hash?.toLowerCase()) {
    const summary = mls.mergePending(runtime.record.g);
    await finalizeOwnCommit(ctx, runtime, {
      pending,
      summary,
      seq: item.seq,
      serverTs: item.created_at,
    });
    return true;
  }
  // Another member's commit won this epoch (first commit wins, 0.4).
  mls.discardPending(runtime.record.g);
  runtime.record.pendingCommit = null;
  return false;
}

async function processEntryItem(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: ApiE2eeLogItem
): Promise<void> {
  const record = runtime.record;
  if (item.epoch < record.epoch) {
    return; // Already applied (our own commit, or a replay).
  }
  if (item.epoch > record.epoch) {
    markInvalid(ctx, runtime, "epoch-gap", false);
    return;
  }
  if (
    item.kind === "commit" &&
    (await resolvePendingFromLog(ctx, runtime, item))
  ) {
    return;
  }
  await prefetchDevices(ctx, item.roster_add);
  let result;
  try {
    result = requireMls(ctx).processEntry(record.g, wasmItem(item));
  } catch (error) {
    if (!(error instanceof MlsError)) {
      throw error;
    }
    if (item.kind === "commit") {
      markInvalid(ctx, runtime, "mls-process", false);
    }
    return;
  }
  if (result.kind === "own") {
    await applySummary(ctx, runtime, requireMls(ctx).groupSummary(record.g));
  } else if (result.kind === "proposal") {
    await handleProposal(ctx, runtime, result);
  } else {
    await handleStagedCommit(ctx, runtime, item, result);
  }
}

async function markOutboxSent(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: ApiE2eeLogItem
): Promise<boolean> {
  for (const entry of runtime.outbox.values()) {
    if (entry.sealed?.data === item.data) {
      runtime.outbox.delete(entry.id);
      const message = await loadMessage(ctx, runtime, entry.id);
      if (message && entry.payload.t === "msg") {
        message.pending = false;
        message.seq = item.seq;
        message.serverTs = item.created_at;
        runtime.dirty.add(message.id);
      }
      ctx.store.touch(runtime.record.g);
      return true;
    }
  }
  return false;
}

/** 8.1.3: a message whose epoch_fp differs from ours => split-view alarm. */
function checkEpochFp(
  runtime: GroupRuntime,
  ours: string | undefined,
  declared: string | null
): void {
  if (ours && declared && ours !== declared.toLowerCase()) {
    runtime.record.splitView = true;
  }
}

async function processMessageItem(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: ApiE2eeLogItem
): Promise<string | null> {
  const record = runtime.record;
  const sentIndex = record.sentSeqs.indexOf(item.seq);
  if (sentIndex >= 0) {
    record.sentSeqs.splice(sentIndex, 1);
    return null;
  }
  if (
    (await markOutboxSent(ctx, runtime, item)) ||
    runtime.messages.has(undecryptableId(item.seq))
  ) {
    return null;
  }
  const placeholder = () => {
    const message = placeholderMessage({
      g: record.g,
      seq: item.seq,
      serverTs: item.created_at,
      epoch: item.epoch,
    });
    runtime.messages.set(message.id, message);
    runtime.dirty.add(message.id);
    return message.id;
  };
  let decrypted;
  try {
    decrypted = requireMls(ctx).decryptMessage(record.g, wasmItem(item));
  } catch (error) {
    if (!(error instanceof MlsError)) {
      throw error;
    }
    return placeholder();
  }
  checkEpochFp(
    runtime,
    decrypted.epoch_fp ?? record.epochFps[String(decrypted.epoch)],
    item.epoch_fp
  );
  const payload = decodePayload(base64ToBytes(decrypted.body));
  if (!payload) {
    return placeholder();
  }
  const senderDeviceKey = decrypted.sender.device_key.toLowerCase();
  if (!(await preparePayload(ctx, runtime, payload))) return payload.id;
  applyPayload(runtime, payload, {
    g: record.g,
    seq: item.seq,
    serverTs: item.created_at,
    senderProfileId: await profileOfLeaf(ctx, senderDeviceKey),
    senderDeviceKey,
    sigOk: decrypted.sig_ok,
    epoch: decrypted.epoch,
    body: decrypted.body,
    sig: decrypted.sig ?? null,
    pending: false,
  });
  record.updatedAt = Math.max(record.updatedAt, item.created_at);
  return payload.id;
}

export async function processLogItem(
  ctx: EngineContext,
  runtime: GroupRuntime,
  item: ApiE2eeLogItem
): Promise<void> {
  if (item.type === "entry") {
    await processEntryItem(ctx, runtime, item);
  } else {
    await processMessageItem(ctx, runtime, item);
  }
  ctx.store.touch(runtime.record.g);
}
