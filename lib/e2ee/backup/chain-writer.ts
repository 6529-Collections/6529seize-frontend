import { asE2eeApiError } from "../api";
import { bytesToBase64 } from "../bytes";
import type { ApiE2eeBackupChunk, E2eeBackupApi } from "./api";
import {
  chainAt,
  type ChainTip,
  type LinkedChunk,
  type LinkMode,
  linkChunk,
  nextLink,
  tipOf,
} from "./chain";
import { chunkHash, sealChunk } from "./crypto";
import { type EncodedSegment, fingerprint, messageKey } from "./format";
import { decodeChunk, followChunk, startNewChain } from "./local-chain";
import type { BackupLocalState } from "./state";

/**
 * Writing a device's chunks into the backup's hash chain (see manager.ts):
 * catching up with chunks the server has after this device's last seen
 * one, and appending a sealed segment at the next seq, following other
 * devices' appends after a 409.
 */

/** Chunks listed per page. */
export const LIST_PAGE = 500;
/** Appends retried after a 409 before falling back to the fork repair. */
const APPEND_CONFLICT_RETRIES = 3;

/** The manager's side of a chain write. */
export interface ChainWriterIo {
  readonly api: E2eeBackupApi;
  readonly state: { put(local: BackupLocalState): Promise<void> };
  /** Runs a request on the generation; its 404 means it was replaced. */
  readonly withBackup: <T>(request: () => Promise<T>) => Promise<T>;
  readonly now: () => number;
}

/** Another device appended first: the expected_seq precondition failed. */
const isSeqConflict = (error: unknown): boolean => {
  const apiError = asE2eeApiError(error);
  return (
    apiError?.status === 409 && apiError.code === "E2EE_BACKUP_SEQ_CONFLICT"
  );
};

/** How one append attempt ended. */
type AppendOutcome = "appended" | "forked" | "conflict";

/**
 * Follows the chunks the server has after this device's last seen seq:
 * its own appends whose response was lost and other devices' appends.
 * Returns true when the server's chain ends on a chunk that does not
 * continue this device's chain (a fork).
 */
export async function catchUp(
  io: ChainWriterIo,
  local: BackupLocalState
): Promise<boolean> {
  let forked = false;
  let after = local.chain.seq;
  for (;;) {
    const page = await io.api.listChunks(local.backupId, after, LIST_PAGE);
    const items = page.items.filter((item) => item.seq > after);
    if (items.length > 0) {
      ({ forked, after } = await followChunks(io, local, items));
    }
    if (page.next_after_seq === null || items.length === 0) {
      break;
    }
  }
  await io.state.put(local);
  return forked;
}

/**
 * Follows the listed chunks in order, each linked after the one before (so
 * one at a time). `forked`: the last one doesn't continue this device's
 * chain; `after`: the last seq followed.
 */
async function followChunks(
  io: ChainWriterIo,
  local: BackupLocalState,
  items: readonly { readonly seq: number }[],
  index = 0
): Promise<{ forked: boolean; after: number }> {
  const item = items[index];
  if (!item) {
    return { forked: false, after: local.chain.seq };
  }
  const linked = await linkListed(
    io.api,
    local,
    tipOf(local.chain),
    item.seq,
    "adopt"
  );
  followChunk(local, item.seq, linked);
  if (index + 1 < items.length) {
    return followChunks(io, local, items, index + 1);
  }
  return { forked: linked === null, after: item.seq };
}

/** Fetches the listed chunk `seq` and links it after `tip` (or null). */
export async function linkListed(
  api: E2eeBackupApi,
  generation: Pick<BackupLocalState, "backupId" | "chunkKey">,
  tip: ChainTip | null,
  seq: number,
  mode: LinkMode
): Promise<LinkedChunk | null> {
  const { backupId, chunkKey } = generation;
  const chunk = await api.getChunk(backupId, seq);
  if (chunk.seq !== seq) {
    return null;
  }
  return linkChunk(chunkKey, backupId, tip, decodeChunk(chunk.data), mode);
}

/**
 * Seals and uploads one segment; true when the chain forked at it or the
 * fork repair is needed (the next run starts a new chain).
 *
 * A 409 means another device appended first: this device follows those
 * chunks and seals the segment again after them, up to
 * APPEND_CONFLICT_RETRIES times. A server without the precondition
 * assigns the next seq anyway; an unexpected seq is then a fork.
 */
export async function appendSegment(
  io: ChainWriterIo,
  local: BackupLocalState,
  deviceKey: string,
  segment: EncodedSegment
): Promise<boolean> {
  for (let retries = 0; ; retries += 1) {
    const outcome = await tryAppend(io, local, deviceKey, segment);
    if (outcome !== "conflict") {
      return outcome === "forked";
    }
    if (
      retries >= APPEND_CONFLICT_RETRIES ||
      !(await followAfterConflict(io, local))
    ) {
      startNewChain(local);
      await io.state.put(local);
      return true;
    }
  }
}

/**
 * After a 409: follows the chunks other devices appended. False when the
 * append cannot simply be retried: those chunks do not continue this
 * device's chain, or there was nothing new to follow (the seq is then
 * resynced so the repair's new chain lands).
 */
async function followAfterConflict(
  io: ChainWriterIo,
  local: BackupLocalState
): Promise<boolean> {
  const seen = local.chain.seq;
  if (await io.withBackup(() => catchUp(io, local))) {
    return false;
  }
  if (local.chain.seq > seen) {
    return true;
  }
  const backup = await io.withBackup(() => io.api.getBackup(local.backupId));
  local.chain = { ...local.chain, seq: backup.next_seq - 1 };
  return false;
}

/** One sealed append at the seq after this device's last seen chunk. */
async function tryAppend(
  io: ChainWriterIo,
  local: BackupLocalState,
  deviceKey: string,
  segment: EncodedSegment
): Promise<AppendOutcome> {
  const link = nextLink(local.chain);
  const data = await sealChunk(
    local.chunkKey,
    local.backupId,
    link,
    segment.json
  );
  const expectedSeq = local.chain.seq + 1;
  let appended: ApiE2eeBackupChunk;
  try {
    appended = await io.withBackup(() =>
      io.api.appendChunk(local.backupId, {
        device_key: deviceKey,
        data: bytesToBase64(data),
        expected_seq: expectedSeq,
      })
    );
  } catch (error) {
    if (isSeqConflict(error)) {
      return "conflict";
    }
    throw error;
  }
  const tip: ChainTip = {
    epoch: link.epoch,
    index: link.index,
    hash: await chunkHash(data),
  };
  local.chain = chainAt(tip, appended.seq);
  for (const group of segment.groups) {
    local.groupPrints[group.g] = fingerprint(group);
  }
  for (const message of segment.messages) {
    local.messagePrints[messageKey(message.g, message.id)] =
      fingerprint(message);
  }
  if (segment.reads.length > 0) {
    local.readsSent = {
      ...local.readsSent,
      ...Object.fromEntries(segment.reads),
    };
    local.readsAt = io.now();
  }
  let forked = false;
  if (link.index === 0) {
    // A new chain: everything before it is superseded once the snapshot
    // that follows is uploaded (compacted at the end of the run).
    if (appended.seq > 1) {
      local.compactThroughSeq = Math.max(
        local.compactThroughSeq ?? 0,
        appended.seq - 1
      );
    }
  } else if (appended.seq !== expectedSeq) {
    // Only a server that ignores expected_seq assigns another seq.
    forked = true;
    startNewChain(local);
  }
  await io.state.put(local);
  return forked ? "forked" : "appended";
}
