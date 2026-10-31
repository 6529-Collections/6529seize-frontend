import { asE2eeApiError } from "../api";
import { base64ToBytes, bytesToBase64, randomHex } from "../bytes";
import type { E2eeDeviceInfo, E2eeEngineStatus } from "../types";
import type { E2eeBackupApi, ApiE2eeBackup } from "./api";
import {
  type BackupChainState,
  chainAt,
  type ChainTip,
  type LinkedChunk,
  type LinkMode,
  isChainState,
  linkChunk,
  newChainState,
  nextLink,
  tipOf,
} from "./chain";
import {
  chunkHash,
  deriveChunkKey,
  MAX_SEGMENT_BYTES,
  newBackupKey,
  openEnvelope,
  sealChunk,
  sealEnvelope,
} from "./crypto";
import {
  BackupError,
  type BackupFailureCode,
  backupErrorCode,
  toBackupError,
} from "./errors";
import {
  type BackupHistory,
  type BackupSegment,
  decodeSegment,
  type EncodedSegment,
  fingerprint,
  mergeSegments,
  messageKey,
  packSegments,
} from "./format";
import { generateRecoveryCode, parseRecoveryCode } from "./recovery-code";
import type { BackupLocalState, BackupStateStore } from "./state";

/**
 * Encrypted message-history backup (history backup v2, design P35 8).
 *
 * - Turning backup on creates a random backup key K_b and a recovery code,
 *   uploads K_b wrapped by the code (the envelope) and then the whole local
 *   history as encrypted, padded chunks. Later runs append only records that
 *   changed (incremental). MLS state is never part of it.
 * - Chunks form a hash chain (chain.ts). Before appending, a device follows
 *   whatever the server has after its last seen chunk (its own appends whose
 *   response was lost, other devices' appends) so it continues the same
 *   chain. If two devices append at the same moment the chain forks; the
 *   device that notices starts a new chain with a full snapshot and compacts
 *   everything before it, exactly like a regular compaction.
 * - Restoring on another device unwraps K_b with the code, downloads and
 *   verifies the whole chain, merges the segments (later chunks win) and
 *   imports the result into local history. Any gap, reorder, replay or
 *   broken link fails the restore with E2EE_BACKUP_CORRUPT and imports
 *   nothing. The device still joins groups through normal MLS device adds;
 *   a restored chat is read-only until then.
 * - A new recovery code means a new K_b and a new generation that replaces
 *   the old one only once fully uploaded. Turning backup off deletes
 *   everything on the server.
 */

/** The engine surface the backup module needs. */
export interface BackupEngine {
  getStatus(): E2eeEngineStatus;
  getThisDevice(): E2eeDeviceInfo | null;
  subscribe(listener: () => void): () => void;
  backupHistory(): BackupHistory;
  importBackupHistory(
    history: BackupHistory
  ): Promise<{ conversations: number; messages: number }>;
}

export type E2eeBackupPhase =
  | "loading"
  /** No backup on the server. */
  | "off"
  /** The server has a backup this device is not connected to. */
  | "available"
  /** This device backs up into the active (or pending) generation. */
  | "on"
  | "error";

export interface E2eeBackupSnapshot {
  readonly phase: E2eeBackupPhase;
  /** The server's active generation. */
  readonly backupCreatedAt: number | null;
  readonly backupUpdatedAt: number | null;
  readonly usedBytes: number;
  readonly quotaBytes: number;
  readonly lastBackupAt: number | null;
  /** A backup or restore run is in progress. */
  readonly busy: boolean;
  /** The first full upload (or a replacement) has not finished yet. */
  readonly uploading: boolean;
  /** Last failure code of a background run (UI maps it to copy). */
  readonly lastError: BackupFailureCode | null;
}

export interface PreparedBackup {
  /** Display form; show once, never store. */
  readonly code: string;
  readonly secret: Uint8Array;
}

export interface RestoreResult {
  readonly conversations: number;
  readonly messages: number;
}

interface BackupScheduler {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

interface E2eeBackupManagerDeps {
  readonly profileId: string;
  readonly engine: BackupEngine;
  readonly api: E2eeBackupApi;
  readonly state: BackupStateStore;
  readonly now?: () => number;
  readonly scheduler?: BackupScheduler;
  /** Delay between a history change and the next incremental run. */
  readonly debounceMs?: number;
  /** Compact once a generation has this many chunks. */
  readonly compactAtChunks?: number;
}

const DEFAULT_DEBOUNCE_MS = 30_000;
const RETRY_MS = 5 * 60_000;
const DEFAULT_COMPACT_AT = 1000;
const LIST_PAGE = 500;

const defaultScheduler: BackupScheduler = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => {
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

const isNotFound = (error: unknown): boolean => {
  const apiError = asE2eeApiError(error);
  return apiError?.status === 404 && apiError.code === "E2EE_NOT_FOUND";
};

export class E2eeBackupManager {
  private readonly deps: E2eeBackupManagerDeps;
  private readonly now: () => number;
  private readonly scheduler: BackupScheduler;
  private readonly listeners = new Set<() => void>();
  private snapshot: E2eeBackupSnapshot = {
    phase: "loading",
    backupCreatedAt: null,
    backupUpdatedAt: null,
    usedBytes: 0,
    quotaBytes: 0,
    lastBackupAt: null,
    busy: false,
    uploading: false,
    lastError: null,
  };
  private local: BackupLocalState | null = null;
  private chain: Promise<unknown> = Promise.resolve();
  private timer: unknown = null;
  private unsubscribe: (() => void) | null = null;
  private disposed = false;

  constructor(deps: E2eeBackupManagerDeps) {
    this.deps = deps;
    this.now = deps.now ?? (() => Date.now());
    this.scheduler = deps.scheduler ?? defaultScheduler;
  }

  // -- state -------------------------------------------------------------------

  getSnapshot = (): E2eeBackupSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(patch: Partial<E2eeBackupSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // A listener failure must not break backups.
      }
    }
  }

  /** Runs operations one at a time (runs, restores and setting changes). */
  private serial<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    this.chain = run.catch(() => undefined);
    return run;
  }

  private deviceKey(): string {
    const device = this.deps.engine.getThisDevice();
    if (this.deps.engine.getStatus() !== "ready" || !device) {
      throw new BackupError("E2EE_BACKUP_NOT_READY");
    }
    return device.deviceKey;
  }

  // -- lifecycle ---------------------------------------------------------------

  /** Loads local and server state and starts incremental backups. */
  async start(): Promise<void> {
    this.unsubscribe = this.deps.engine.subscribe(() => {
      this.schedule(this.deps.debounceMs ?? DEFAULT_DEBOUNCE_MS);
    });
    await this.refresh();
    this.schedule(0);
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.timer !== null) {
      this.scheduler.clearTimeout(this.timer);
      this.timer = null;
    }
    this.listeners.clear();
  }

  private schedule(ms: number): void {
    if (this.disposed || this.local === null) {
      return;
    }
    if (this.timer !== null) {
      this.scheduler.clearTimeout(this.timer);
    }
    this.timer = this.scheduler.setTimeout(() => {
      this.timer = null;
      void this.backupNow().catch(() => undefined);
    }, ms);
  }

  /** Re-reads the server status and this device's local state. */
  refresh(): Promise<void> {
    return this.serial(async () => {
      try {
        await this.loadState();
      } catch (error) {
        this.update({
          phase: "error",
          lastError: backupErrorCode(error),
        });
      }
    });
  }

  private async loadState(): Promise<ApiE2eeBackup | null> {
    let local = await this.deps.state.get(this.deps.profileId);
    const device = this.deps.engine.getThisDevice();
    if (
      local &&
      ((device && local.deviceKey !== device.deviceKey) ||
        !isChainState(local.chain))
    ) {
      // Re-enrolled (or revoked and wiped), or saved before the v2 chain
      // format: the old state is stale.
      await this.deps.state.delete(this.deps.profileId);
      local = null;
    }
    const status = await this.deps.api.getStatus();
    const active = status.backup;
    if (local && active?.backup_id !== local.backupId && local.activated) {
      // Replaced or turned off on another device.
      await this.deps.state.delete(this.deps.profileId);
      local = null;
      this.update({ lastError: "E2EE_BACKUP_REPLACED" });
    }
    this.local = local;
    this.update({
      phase: phaseOf(local !== null, active !== null),
      backupCreatedAt: active?.created_at ?? null,
      backupUpdatedAt: active?.updated_at ?? null,
      usedBytes: status.used_bytes,
      quotaBytes: status.quota_bytes,
      lastBackupAt: local?.lastBackupAt ?? null,
      uploading: local !== null && !local.activated,
    });
    return active;
  }

  // -- turn on / new code -------------------------------------------------------

  /** A new recovery code (not sent anywhere until confirmBackup). */
  async prepareBackup(): Promise<PreparedBackup> {
    this.deviceKey();
    const { code, secret } = await generateRecoveryCode();
    return { code, secret };
  }

  /**
   * Starts a new generation wrapped by the prepared code and uploads the
   * whole history. It replaces any existing backup (and its code) once the
   * upload completes.
   */
  confirmBackup(prepared: PreparedBackup): Promise<void> {
    return this.serial(async () => {
      const deviceKey = this.deviceKey();
      const backupId = randomHex(16);
      const backupKey = newBackupKey();
      const envelope = await sealEnvelope({
        recoverySecret: prepared.secret,
        backupKey,
        backupId,
        profileId: this.deps.profileId,
      });
      const chunkKey = await deriveChunkKey(backupKey, backupId);
      backupKey.fill(0);
      await this.deps.api.createBackup({
        backup_id: backupId,
        envelope,
        device_key: deviceKey,
      });
      const local: BackupLocalState = {
        profileId: this.deps.profileId,
        deviceKey,
        backupId,
        chunkKey,
        activated: false,
        createdAt: this.now(),
        lastBackupAt: null,
        compactThroughSeq: null,
        chain: newChainState(),
        groupPrints: {},
        messagePrints: {},
      };
      await this.deps.state.put(local);
      this.local = local;
      this.update({ phase: "on", uploading: true, lastError: null });
      await this.runIncremental();
    });
  }

  // -- incremental backup ---------------------------------------------------------

  /** Uploads what changed since the last run (no-op when backup is off). */
  backupNow(): Promise<void> {
    return this.serial(async () => {
      if (!this.local) {
        return;
      }
      try {
        await this.runIncremental();
      } catch (error) {
        const failure = toBackupError(error);
        this.update({ lastError: failure.code });
        if (failure.code !== "E2EE_BACKUP_REPLACED") {
          this.schedule(RETRY_MS);
        }
        throw failure;
      }
    });
  }

  private async runIncremental(): Promise<void> {
    const local = this.local;
    if (!local || this.deps.engine.getStatus() !== "ready") {
      return;
    }
    const deviceKey = this.deviceKey();
    this.update({ busy: true });
    try {
      const segments = await this.pendingSegments(local);
      for (const segment of segments) {
        if (await this.appendSegment(local, deviceKey, segment)) {
          // Another device appended at the same moment: the next run starts
          // a new chain with a full snapshot and compacts the fork away.
          this.schedule(0);
          return;
        }
      }
      let backup: ApiE2eeBackup | null = null;
      if (!local.activated) {
        backup = await this.withBackup(() =>
          this.deps.api.activate(local.backupId, deviceKey)
        );
        local.activated = true;
      }
      if (local.compactThroughSeq !== null) {
        backup = await this.withBackup(() =>
          this.deps.api.compact(local.backupId, {
            device_key: deviceKey,
            through_seq: local.compactThroughSeq!,
          })
        );
        local.compactThroughSeq = null;
      }
      local.lastBackupAt = this.now();
      await this.deps.state.put(local);
      backup ??=
        segments.length > 0
          ? await this.withBackup(() => this.deps.api.getBackup(local.backupId))
          : null;
      if (
        backup &&
        !local.chain.restart &&
        backup.chunk_count >= (this.deps.compactAtChunks ?? DEFAULT_COMPACT_AT)
      ) {
        // Re-upload everything as a new chain, then drop the chunks before it.
        startNewChain(local);
        await this.deps.state.put(local);
        this.schedule(0);
      }
      const status = await this.deps.api.getStatus();
      const active = status.backup;
      if (active?.backup_id !== local.backupId) {
        // Our generation is gone: turned off or replaced on another device.
        await this.deps.state.delete(this.deps.profileId);
        this.local = null;
        await this.loadState();
        throw new BackupError("E2EE_BACKUP_REPLACED");
      }
      this.update({
        phase: "on",
        uploading: false,
        lastBackupAt: local.lastBackupAt,
        lastError: null,
        usedBytes: status.used_bytes,
        quotaBytes: status.quota_bytes,
        backupCreatedAt: active.created_at,
        backupUpdatedAt: active.updated_at,
      });
    } finally {
      this.update({ busy: false });
    }
  }

  /** What to upload this run, after catching up with the server's chain. */
  private async pendingSegments(
    local: BackupLocalState
  ): Promise<EncodedSegment[]> {
    const history = this.deps.engine.backupHistory();
    const pack = () =>
      packSegments(
        changedHistory(history, local),
        MAX_SEGMENT_BYTES,
        this.now()
      );
    const segments = pack();
    if (segments.length === 0) {
      return segments;
    }
    const forked = await this.withBackup(() => this.catchUp(local));
    if (!forked) {
      return segments;
    }
    startNewChain(local);
    await this.deps.state.put(local);
    return pack();
  }

  /**
   * Follows the chunks the server has after this device's last seen seq:
   * its own appends whose response was lost and other devices' appends.
   * Returns true when the server's chain ends on a chunk that does not
   * continue this device's chain (a fork).
   */
  private async catchUp(local: BackupLocalState): Promise<boolean> {
    let forked = false;
    let after = local.chain.seq;
    for (;;) {
      const page = await this.deps.api.listChunks(
        local.backupId,
        after,
        LIST_PAGE
      );
      const items = page.items.filter((item) => item.seq > after);
      for (const item of items) {
        const linked = await this.linkListed(
          local.backupId,
          local.chunkKey,
          tipOf(local.chain),
          item.seq,
          "adopt"
        );
        forked = linked === null;
        followChunk(local, item.seq, linked);
        after = item.seq;
      }
      if (page.next_after_seq === null || items.length === 0) {
        break;
      }
    }
    await this.deps.state.put(local);
    return forked;
  }

  /** Fetches the listed chunk `seq` and links it after `tip` (or null). */
  private async linkListed(
    backupId: string,
    chunkKey: CryptoKey,
    tip: ChainTip | null,
    seq: number,
    mode: LinkMode
  ): Promise<LinkedChunk | null> {
    const chunk = await this.deps.api.getChunk(backupId, seq);
    if (chunk.seq !== seq) {
      return null;
    }
    return linkChunk(chunkKey, backupId, tip, decodeChunk(chunk.data), mode);
  }

  /** Seals and uploads one segment; true when the chain forked at it. */
  private async appendSegment(
    local: BackupLocalState,
    deviceKey: string,
    segment: EncodedSegment
  ): Promise<boolean> {
    const link = nextLink(local.chain);
    const data = await sealChunk(
      local.chunkKey,
      local.backupId,
      link,
      segment.json
    );
    const expectedSeq = local.chain.seq + 1;
    const appended = await this.withBackup(() =>
      this.deps.api.appendChunk(local.backupId, {
        device_key: deviceKey,
        data: bytesToBase64(data),
      })
    );
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
    let forked = false;
    if (link.index === 0) {
      // A new chain: everything before it is superseded once the snapshot
      // that follows is uploaded (compacted at the end of the run).
      if (appended.seq > 1) {
        local.compactThroughSeq = appended.seq - 1;
      }
    } else if (appended.seq !== expectedSeq) {
      forked = true;
      startNewChain(local);
    }
    await this.deps.state.put(local);
    return forked;
  }

  /** A 404 on our generation means it was deleted or replaced elsewhere. */
  private async withBackup<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (isNotFound(error)) {
        await this.deps.state.delete(this.deps.profileId);
        this.local = null;
        await this.loadState().catch(() => null);
        throw new BackupError("E2EE_BACKUP_REPLACED");
      }
      throw error;
    }
  }

  // -- restore ------------------------------------------------------------------

  /**
   * Restores history from the active backup with a recovery code. A
   * malformed code fails before any request (E2EE_BACKUP_CODE_FORMAT); a
   * well-formed wrong code fails cleanly with E2EE_BACKUP_WRONG_CODE and
   * imports nothing. On success this device also backs up into the same
   * generation from now on.
   */
  restore(codeInput: string): Promise<RestoreResult> {
    return this.serial(async () => {
      const deviceKey = this.deviceKey();
      const secret = await parseRecoveryCode(codeInput);
      if (!secret) {
        throw new BackupError("E2EE_BACKUP_CODE_FORMAT");
      }
      this.update({ busy: true });
      try {
        const active = await this.loadState();
        if (!active?.active) {
          throw new BackupError("E2EE_BACKUP_NONE");
        }
        const backupKey = await openEnvelope({
          envelope: active.envelope,
          recoverySecret: secret,
          backupId: active.backup_id,
          profileId: this.deps.profileId,
        });
        const chunkKey = await deriveChunkKey(backupKey, active.backup_id);
        backupKey.fill(0);
        const { segments, chain } = await this.download(
          active.backup_id,
          chunkKey
        );
        const history = mergeSegments(segments);
        const result = await this.deps.engine.importBackupHistory(history);
        // Already in the backup: only later changes need uploading.
        const local: BackupLocalState = {
          profileId: this.deps.profileId,
          deviceKey,
          backupId: active.backup_id,
          chunkKey,
          activated: true,
          createdAt: this.now(),
          lastBackupAt: this.now(),
          compactThroughSeq: null,
          chain,
          groupPrints: Object.fromEntries(
            history.groups.map((group) => [group.g, fingerprint(group)])
          ),
          messagePrints: Object.fromEntries(
            history.messages.map((message) => [
              messageKey(message.g, message.id),
              fingerprint(message),
            ])
          ),
        };
        await this.deps.state.put(local);
        this.local = local;
        this.update({
          phase: "on",
          lastBackupAt: local.lastBackupAt,
          lastError: null,
        });
        this.schedule(this.deps.debounceMs ?? DEFAULT_DEBOUNCE_MS);
        return result;
      } finally {
        this.update({ busy: false });
      }
    });
  }

  /**
   * Downloads and verifies the whole chain (chain.ts) before anything is
   * imported; any break throws E2EE_BACKUP_CORRUPT.
   */
  private async download(
    backupId: string,
    chunkKey: CryptoKey
  ): Promise<{ segments: BackupSegment[]; chain: BackupChainState }> {
    const segments: BackupSegment[] = [];
    let tip: ChainTip | null = null;
    let after = 0;
    for (;;) {
      const page = await this.deps.api.listChunks(backupId, after, LIST_PAGE);
      for (const item of page.items) {
        // Seqs must strictly increase; then the chunk must link.
        const linked: LinkedChunk | null =
          item.seq > after
            ? await this.linkListed(
                backupId,
                chunkKey,
                tip,
                item.seq,
                "restore"
              )
            : null;
        if (!linked) {
          throw new BackupError("E2EE_BACKUP_CORRUPT");
        }
        tip = linked.tip;
        after = item.seq;
        segments.push(decodeSegment(linked.json));
      }
      if (page.next_after_seq === null) {
        break;
      }
      if (page.items.length === 0) {
        throw new BackupError("E2EE_BACKUP_CORRUPT");
      }
    }
    return {
      segments,
      chain: tip ? chainAt(tip, after) : { ...newChainState(), seq: after },
    };
  }

  // -- turn off -------------------------------------------------------------------

  /** Deletes every backup on the server; every recovery code stops working. */
  turnOff(): Promise<void> {
    return this.serial(async () => {
      await this.deps.api.deleteAll();
      await this.deps.state.delete(this.deps.profileId);
      this.local = null;
      if (this.timer !== null) {
        this.scheduler.clearTimeout(this.timer);
        this.timer = null;
      }
      await this.loadState();
      this.update({ lastError: null, uploading: false });
    });
  }
}

function phaseOf(
  connected: boolean,
  serverHasBackup: boolean
): E2eeBackupPhase {
  if (connected) {
    return "on";
  }
  return serverHasBackup ? "available" : "off";
}

/** Chunk bytes from the API; malformed base64 never links. */
function decodeChunk(data: string): Uint8Array {
  try {
    return base64ToBytes(data);
  } catch {
    return new Uint8Array(0);
  }
}

/** Moves a writer's chain state past one chunk it found on the server. */
function followChunk(
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
function startNewChain(local: BackupLocalState): void {
  local.chain = { ...local.chain, restart: true };
  local.groupPrints = {};
  local.messagePrints = {};
}

/** Records whose fingerprint differs from what this device uploaded. */
function changedHistory(
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
