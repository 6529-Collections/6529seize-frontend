import { historyKey, type HistoryKey } from "../history-order";
import { loadMessage, recountUnread, trimHistory } from "./history";
import type { BackupHistory, BackupMessageRecord } from "../backup/format";
import type { StoredGroup, StoredMessage } from "../records";
import { checkpoint, ownDeviceKey, type EngineContext } from "./context";
import { newRuntime } from "./groups";
import type { GroupRuntime } from "./store";

/**
 * Engine side of encrypted history backups. The backup module reads copies of
 * the decrypted history (never MLS state) and hands restored history back.
 */

function withoutPending(message: StoredMessage): BackupMessageRecord {
  const { pending: _pending, ...rest } = message;
  return rest;
}

export async function backupHistory(
  ctx: EngineContext
): Promise<BackupHistory> {
  const out: BackupHistory = { groups: [], messages: [] };
  // Read positions go into the backup with read-state sync on (P60 §5).
  const withReads = ctx.options.readSync === true;
  const reads: Record<string, number> = {};
  for (const runtime of ctx.store.groups.values()) {
    const record = runtime.record;
    // A self group holds no history, only read-state sync (D175, P60).
    if (record.metadata.kind === "self") {
      continue;
    }
    if (withReads && record.readSeq > 0) {
      reads[record.g] = record.readSeq;
    }
    out.groups.push({
      g: record.g,
      metadata: structuredClone(record.metadata),
      members: record.members.map((member) => ({ ...member })),
      epoch: record.epoch,
      epochFp: record.epochFp,
      createdAt: record.createdAt,
      joinedAt: record.joinedAt,
      updatedAt: record.updatedAt,
    });
    let after: HistoryKey = [0, Number.NEGATIVE_INFINITY, 0, ""];
    for (;;) {
      const rows = await ctx.storage.pageMessages(ctx.profileId, record.g, {
        after,
        limit: 200,
      });
      if (!rows.length) break;
      out.messages.push(
        ...rows.filter((message) => !message.pending).map(withoutPending)
      );
      after = historyKey(rows.at(-1)!);
    }
  }
  if (Object.keys(reads).length > 0) {
    out.reads = reads;
  }
  return out;
}

/**
 * A conversation known only from the backup: read-only ("restored") until
 * this device joins it through a normal MLS device add. Cursor 0 so the join
 * processes the log from this device's first epoch.
 */
function restoredGroup(
  record: BackupHistory["groups"][number],
  readSeq: number
): StoredGroup {
  return {
    g: record.g.toLowerCase(),
    status: "restored",
    metadata: structuredClone(record.metadata),
    cursor: 0,
    epoch: record.epoch,
    epochFp: record.epochFp,
    epochFps: {},
    commitKey: "",
    members: record.members.map((member) => ({
      ...member,
      deviceKey: member.deviceKey.toLowerCase(),
    })),
    splitView: false,
    invalidReason: null,
    delayed: false,
    leaving: [],
    badGrants: [],
    activity: {},
    lastSelfUpdateAt: 0,
    selfUpdateRequested: false,
    rosterCheckNeeded: false,
    sentSeqs: [],
    readSeq,
    createdAt: record.createdAt,
    joinedAt: record.joinedAt,
    updatedAt: record.updatedAt,
    pendingCommit: null,
  };
}

function groupMessages(
  messages: readonly BackupMessageRecord[]
): Map<string, BackupMessageRecord[]> {
  const out = new Map<string, BackupMessageRecord[]>();
  for (const message of messages) {
    const g = message.g.toLowerCase();
    const list = out.get(g) ?? [];
    list.push(message);
    out.set(g, list);
  }
  return out;
}

/**
 * Merges restored history into local state: local copies win (they are this
 * device's own view), missing messages are added, unknown conversations are
 * added as read-only. Must run inside the serial queue.
 */
export async function importBackupHistory(
  ctx: EngineContext,
  history: BackupHistory
): Promise<{ conversations: number; messages: number }> {
  const records = new Map(
    history.groups.map((group) => [group.g.toLowerCase(), group])
  );
  const messagesByGroup = groupMessages(history.messages);
  const reads = new Map(
    Object.entries(history.reads ?? {}).map(([g, seq]) => [
      g.toLowerCase(),
      seq,
    ])
  );
  const touched: GroupRuntime[] = [];
  const restoredHere = new Set<string>();
  let conversations = 0;
  let imported = 0;
  for (const [g, record] of records) {
    const restored = messagesByGroup.get(g) ?? [];
    const maxSeq = restored.reduce(
      (max, message) => Math.max(max, message.seq),
      0
    );
    let runtime = ctx.store.groups.get(g);
    if (!runtime) {
      // P60 §5: the backed-up read position when there is one, but never
      // past the chat's latest known message, the last one restored; without
      // one everything restored counts as read, as before.
      const read = Math.min(reads.get(g) ?? maxSeq, maxSeq);
      runtime = newRuntime(restoredGroup(record, read));
      ctx.store.groups.set(g, runtime);
      restoredHere.add(g);
      conversations += 1;
    }
    for (const message of restored) {
      if (await loadMessage(ctx, runtime, message.id)) {
        trimHistory(runtime, ctx.openConversation === g);
        continue;
      }
      const stored: StoredMessage = { ...message, g, pending: false };
      runtime.messages.set(message.id, stored);
      runtime.dirty.add(message.id);
      imported += 1;
      if (runtime.dirty.size >= 100)
        await checkpoint(ctx, { groups: [runtime], skipWasm: true });
    }
    touched.push(runtime);
    ctx.store.touch(g);
  }
  if (touched.length > 0) {
    await checkpoint(ctx, { groups: touched, skipWasm: true });
  }
  await applyBackedUpReads(
    ctx,
    new Map([...reads].filter(([g]) => !restoredHere.has(g)))
  );
  return { conversations, messages: imported };
}

/**
 * The latest position each joined chat is known to have: its last_seq as
 * the server lists it now, else this device's own cursor (P60 §5).
 */
async function latestKnown(
  ctx: EngineContext,
  runtimes: readonly GroupRuntime[]
): Promise<Map<string, number>> {
  const listed = new Map<string, number>();
  try {
    for (const item of await ctx.api.getDeviceGroups(ownDeviceKey(ctx))) {
      listed.set(item.group.toLowerCase(), item.last_seq);
    }
  } catch {
    // Without the list, the device's own cursor is the latest it knows.
  }
  return new Map(
    runtimes.map((runtime) => [
      runtime.record.g,
      listed.get(runtime.record.g) ?? runtime.record.cursor,
    ])
  );
}

/**
 * Moves chats this device already has forward to a backed-up read position
 * (never back), then recounts their unread messages (D175, P60 §5).
 */
async function applyBackedUpReads(
  ctx: EngineContext,
  reads: ReadonlyMap<string, number>
): Promise<void> {
  const candidates = [...reads].flatMap(([g, seq]) => {
    const runtime = ctx.store.groups.get(g);
    return runtime &&
      runtime.record.metadata.kind !== "self" &&
      seq > runtime.record.readSeq
      ? [{ runtime, seq }]
      : [];
  });
  if (candidates.length === 0) {
    return;
  }
  // Never past the chat's latest known position: a backed-up position
  // beyond it is cut to it, not applied blindly.
  const latest = await latestKnown(
    ctx,
    candidates.map((item) => item.runtime)
  );
  const moved: GroupRuntime[] = [];
  for (const { runtime, seq } of candidates) {
    const position = Math.min(seq, latest.get(runtime.record.g) ?? 0);
    if (position > runtime.record.readSeq) {
      runtime.record.readSeq = position;
      moved.push(runtime);
    }
  }
  if (moved.length === 0) {
    return;
  }
  await checkpoint(ctx, { groups: moved, skipWasm: true });
  await Promise.all(moved.map((runtime) => recountUnread(ctx, runtime)));
  await checkpoint(ctx, { groups: moved, skipWasm: true });
}
