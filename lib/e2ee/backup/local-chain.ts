import { base64ToBytes } from "../bytes";
import { chainAt, type LinkedChunk } from "./chain";
import { type BackupHistory, fingerprint, messageKey } from "./format";
import type { BackupLocalState } from "./state";

// A writer's local view of the backup chain, outside the manager class.

/** Chunk bytes from the API; malformed base64 never links. */
export function decodeChunk(data: string): Uint8Array {
  try {
    return base64ToBytes(data);
  } catch {
    return new Uint8Array(0);
  }
}

/** Moves a writer's chain state past one chunk it found on the server. */
export function followChunk(
  local: BackupLocalState,
  seq: number,
  linked: LinkedChunk | null
): void {
  if (!linked) {
    // Does not continue this device's chain: remember it was seen.
    local.chain = { ...local.chain, seq };
    return;
  }
  const started =
    local.chain.index >= 0 && linked.tip.epoch > local.chain.epoch;
  if (started && local.chain.restart) {
    // A newer chain already exists (another device's, or ours whose
    // response was lost): follow it instead of starting another one. This
    // run still uploads the full history into it, so the chunks before it
    // can be compacted at the end of the run.
    local.compactThroughSeq = Math.max(local.compactThroughSeq ?? 0, seq - 1);
  }
  local.chain = chainAt(linked.tip, seq, local.chain.restart && !started);
}

/**
 * The next chunk starts a new chain and the whole history is uploaded again
 * after it (compaction, or repairing a fork). The chunks before it are
 * compacted once that upload finishes.
 */
export function startNewChain(local: BackupLocalState): void {
  local.chain = { ...local.chain, restart: true };
  local.groupPrints = {};
  local.messagePrints = {};
}

/** Records whose fingerprint differs from what this device uploaded. */
export function changedHistory(
  history: BackupHistory,
  local: BackupLocalState
): BackupHistory {
  return {
    groups: history.groups.filter(
      (group) => local.groupPrints[group.g] !== fingerprint(group)
    ),
    messages: history.messages.filter(
      (message) =>
        local.messagePrints[messageKey(message.g, message.id)] !==
        fingerprint(message)
    ),
  };
}
