import type { BackupHistory, BackupMessageRecord } from "../backup/format";
import type { StoredGroup, StoredMessage } from "../records";
import { checkpoint, type EngineContext } from "./context";
import { newRuntime } from "./groups";
import type { GroupRuntime } from "./store";

/**
 * Engine side of encrypted history backups. The backup module reads copies of
 * the decrypted history (never MLS state) and hands restored history back.
 */

export function backupHistory(ctx: EngineContext): BackupHistory {
  const out: BackupHistory = { groups: [], messages: [] };
  for (const runtime of ctx.store.groups.values()) {
    const record = runtime.record;
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
    for (const message of runtime.messages.values()) {
      if (message.pending) {
        continue;
      }
      const { pending: _pending, ...rest } = structuredClone(message);
      out.messages.push(rest);
    }
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
  const touched: GroupRuntime[] = [];
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
      runtime = newRuntime(restoredGroup(record, maxSeq));
      ctx.store.groups.set(g, runtime);
      conversations += 1;
    }
    for (const message of restored) {
      if (runtime.messages.has(message.id)) {
        continue;
      }
      const stored: StoredMessage = { ...message, g, pending: false };
      runtime.messages.set(message.id, stored);
      runtime.dirty.add(message.id);
      imported += 1;
    }
    touched.push(runtime);
    ctx.store.touch(g);
  }
  if (touched.length > 0) {
    await checkpoint(ctx, { groups: touched, skipWasm: true });
  }
  return { conversations, messages: imported };
}
