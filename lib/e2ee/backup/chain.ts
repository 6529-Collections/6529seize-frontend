import { base64ToBytes, bytesToBase64 } from "../bytes";
import {
  type ChunkLink,
  chunkHash,
  equalBytes,
  openChunk,
  ZERO_CHAIN_HASH,
} from "./crypto";
import { BackupError } from "./errors";

/**
 * Hash chain over a generation's chunks (history backup v2).
 *
 * Every chunk names its index and the SHA-256 of the previous chunk's
 * ciphertext (both bound by the AEAD aad, see crypto.ts). Restore walks the
 * chunks in server seq order and requires each one to either
 *
 * - continue the chain: index + 1, prev = hash of the previous chunk, same
 *   epoch; or
 * - start a new chain (compaction snapshot or fork repair): index 0, zero
 *   prev, a higher epoch, and a base equal to the tip it supersedes. The
 *   very first chunk may be any chain start; its base was compacted away.
 *
 * Anything else (a gap, reorder, replay, duplicate or broken link) fails
 * the whole restore with E2EE_BACKUP_CORRUPT before anything is imported.
 * What the server can still do is cut off the newest chunks: without a
 * trusted copy of the tip nothing can tell a shorter chain from a full one.
 */

/** The last chunk a chain walk accepted. */
export interface ChainTip {
  readonly epoch: number;
  readonly index: number;
  /** SHA-256 of that chunk's ciphertext. */
  readonly hash: Uint8Array;
}

/** A chunk accepted after a tip: the new tip and its segment JSON. */
export interface LinkedChunk {
  readonly tip: ChainTip;
  readonly json: Uint8Array;
}

/** A writer's persisted chain position (BackupLocalState.chain). */
export interface BackupChainState {
  /** Epoch of the current chain (0 until the first compaction). */
  epoch: number;
  /** Index of this chain's last chunk; -1 before the first chunk. */
  index: number;
  /** Base64 SHA-256 of that chunk's ciphertext; "" before the first. */
  hash: string;
  /** Highest server seq this device has uploaded or examined. */
  seq: number;
  /** The next chunk starts a new chain (compaction or fork repair). */
  restart: boolean;
}

export const newChainState = (): BackupChainState => ({
  epoch: 0,
  index: -1,
  hash: "",
  seq: 0,
  restart: false,
});

export function isChainState(value: unknown): value is BackupChainState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const chain = value as Partial<BackupChainState>;
  return (
    Number.isInteger(chain.epoch) &&
    Number.isInteger(chain.index) &&
    typeof chain.hash === "string" &&
    // A tip's hash is 32 bytes of base64 (44 characters).
    (chain.index! < 0 || chain.hash.length === 44) &&
    Number.isInteger(chain.seq) &&
    typeof chain.restart === "boolean"
  );
}

export const tipOf = (chain: BackupChainState): ChainTip | null =>
  chain.index < 0
    ? null
    : {
        epoch: chain.epoch,
        index: chain.index,
        hash: base64ToBytes(chain.hash),
      };

/** The chain state after uploading (or adopting) `tip` at server `seq`. */
export const chainAt = (
  tip: ChainTip,
  seq: number,
  restart = false
): BackupChainState => ({
  epoch: tip.epoch,
  index: tip.index,
  hash: bytesToBase64(tip.hash),
  seq,
  restart,
});

/** Where the next chunk a writer seals goes. */
export function nextLink(chain: BackupChainState): ChunkLink {
  const tip = tipOf(chain);
  if (!tip) {
    return { epoch: chain.epoch, index: 0, prev: ZERO_CHAIN_HASH, base: null };
  }
  if (chain.restart) {
    return {
      epoch: tip.epoch + 1,
      index: 0,
      prev: ZERO_CHAIN_HASH,
      base: { index: tip.index, hash: tip.hash },
    };
  }
  return { epoch: tip.epoch, index: tip.index + 1, prev: tip.hash, base: null };
}

async function tryOpen(
  key: CryptoKey,
  backupId: string,
  expected: { index: number; prev: Uint8Array },
  data: Uint8Array
): Promise<{ link: ChunkLink; json: Uint8Array } | null> {
  try {
    return await openChunk(key, backupId, expected, data);
  } catch (error) {
    if (error instanceof BackupError && error.code === "E2EE_BACKUP_CORRUPT") {
      return null;
    }
    throw error;
  }
}

/**
 * How a chain start after the first chunk is checked:
 * - "restore": its base must be the current tip (nothing in between was
 *   dropped), as described above.
 * - "adopt": a writer catching up with chunks other devices (or its own
 *   lost requests) appended; any higher epoch is followed, because the
 *   device that started it may have seen a different fork branch.
 */
export type LinkMode = "restore" | "adopt";

/**
 * Accepts `data` as the chunk after `tip` (null: the first chunk) and
 * returns the new tip and the segment JSON, or null when it does not link.
 */
export async function linkChunk(
  key: CryptoKey,
  backupId: string,
  tip: ChainTip | null,
  data: Uint8Array,
  mode: LinkMode
): Promise<LinkedChunk | null> {
  let opened: { link: ChunkLink; json: Uint8Array } | null = null;
  if (tip) {
    opened = await tryOpen(
      key,
      backupId,
      { index: tip.index + 1, prev: tip.hash },
      data
    );
    if (opened && opened.link.epoch !== tip.epoch) {
      return null;
    }
  }
  if (!opened) {
    opened = await tryOpen(
      key,
      backupId,
      { index: 0, prev: ZERO_CHAIN_HASH },
      data
    );
    if (!opened || (tip && !startsAfter(opened.link, tip, mode))) {
      return null;
    }
  }
  return {
    tip: {
      epoch: opened.link.epoch,
      index: opened.link.index,
      hash: await chunkHash(data),
    },
    json: opened.json,
  };
}

function startsAfter(link: ChunkLink, tip: ChainTip, mode: LinkMode): boolean {
  if (link.epoch <= tip.epoch) {
    return false;
  }
  if (mode === "adopt") {
    return true;
  }
  return (
    link.base !== null &&
    link.base.index === tip.index &&
    equalBytes(link.base.hash, tip.hash)
  );
}
