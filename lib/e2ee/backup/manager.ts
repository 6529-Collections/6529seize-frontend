import { asE2eeApiError } from "../api";
import { base64ToBytes, bytesToBase64, randomHex } from "../bytes";
import type { E2eeDeviceInfo, E2eeEngineStatus } from "../types";
import type { E2eeBackupApi, ApiE2eeBackup } from "./api";
import {
  deriveChunkKey,
  MAX_SEGMENT_BYTES,
  newBackupKey,
  openChunk,
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
  fingerprint,
  mergeSegments,
  messageKey,
  packSegments,
} from "./format";
import { generateRecoveryCode, parseRecoveryCode } from "./recovery-code";
import type { BackupLocalState, BackupStateStore } from "./state";

/**
 * Encrypted message-history backup (history backup v1, design P35 8).
 *
 * - Turning backup on creates a random backup key K_b and a recovery code,
 *   uploads K_b wrapped by the code (the envelope) and then the whole local
 *   history as encrypted, padded chunks. Later runs append only records that
 *   changed (incremental). MLS state is never part of it.
 * - Restoring on another device unwraps K_b with the code, downloads and
 *   decrypts every chunk, merges them (later chunks win) and imports the
 *   result into local history. The device still joins groups through normal
 *   MLS device adds; a restored chat is read-only until then.
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
    for (const listener of [...this.listeners]) {
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
    if (local && device && local.deviceKey !== device.deviceKey) {
      // Re-enrolled (or revoked and wiped): the old device's state is stale.
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
      const history = this.deps.engine.backupHistory();
      const changed = changedHistory(history, local);
      const segments = packSegments(changed, MAX_SEGMENT_BYTES, this.now());
      for (const segment of segments) {
        const data = await sealChunk(
          local.chunkKey,
          local.backupId,
          segment.json
        );
        await this.withBackup(() =>
          this.deps.api.appendChunk(local.backupId, {
            device_key: deviceKey,
            data: bytesToBase64(data),
          })
        );
        for (const group of segment.groups) {
          local.groupPrints[group.g] = fingerprint(group);
        }
        for (const message of segment.messages) {
          local.messagePrints[messageKey(message.g, message.id)] =
            fingerprint(message);
        }
        await this.deps.state.put(local);
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
        backup.chunk_count >= (this.deps.compactAtChunks ?? DEFAULT_COMPACT_AT)
      ) {
        // Re-upload everything, then drop the chunks it supersedes.
        local.compactThroughSeq = backup.next_seq - 1;
        local.groupPrints = {};
        local.messagePrints = {};
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
        const segments = await this.download(active.backup_id, chunkKey);
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

  private async download(
    backupId: string,
    chunkKey: CryptoKey
  ): Promise<BackupSegment[]> {
    const segments: BackupSegment[] = [];
    let after = 0;
    for (;;) {
      const page = await this.deps.api.listChunks(backupId, after, LIST_PAGE);
      for (const item of page.items) {
        const chunk = await this.deps.api.getChunk(backupId, item.seq);
        const json = await openChunk(
          chunkKey,
          backupId,
          base64ToBytes(chunk.data)
        );
        segments.push(decodeSegment(json));
      }
      if (page.next_after_seq === null) {
        return segments;
      }
      after = page.next_after_seq;
    }
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
