import { asE2eeApiError } from "../api";
import { randomHex } from "../bytes";
import type { ApiE2eeBackup } from "./api";
import {
  type BackupChainState,
  chainAt,
  type ChainTip,
  type LinkedChunk,
  isChainState,
  newChainState,
} from "./chain";
import {
  appendSegment,
  catchUp,
  type ChainWriterIo,
  LIST_PAGE,
  linkListed,
} from "./chain-writer";
import {
  deriveChunkKey,
  MAX_SEGMENT_BYTES,
  newBackupKey,
  openEnvelope,
  sealEnvelope,
} from "./crypto";
import { BackupError, backupErrorCode, toBackupError } from "./errors";
import {
  type BackupSegment,
  decodeSegment,
  type EncodedSegment,
  fingerprint,
  mergeSegments,
  messageKey,
  packSegments,
} from "./format";
import { generateRecoveryCode, parseRecoveryCode } from "./recovery-code";
import type { BackupLocalState } from "./state";
import { changedHistory, startNewChain } from "./local-chain";
import type {
  BackupCounts,
  BackupScheduler,
  E2eeBackupManagerDeps,
  E2eeBackupPhase,
  E2eeBackupSnapshot,
  PreparedBackup,
  RestoreResult,
} from "./manager-types";

export type {
  BackupEngine,
  E2eeBackupSnapshot,
  PreparedBackup,
  RestoreResult,
} from "./manager-types";

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
 *   chain. Every append names the seq it must get (expected_seq); when two
 *   devices append at the same moment the server refuses the later one
 *   (409), which follows the other chunk and appends after it. Only when
 *   that keeps failing, or the server predates the precondition and the
 *   chain forks, the device starts a new chain with a full snapshot and
 *   compacts everything before it, exactly like a regular compaction.
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

const DEFAULT_DEBOUNCE_MS = 30_000;
const RETRY_MS = 5 * 60_000;

/** Chats and messages this device has put in (or restored from) the backup. */
const countsOf = (local: BackupLocalState | null): BackupCounts | null =>
  local
    ? {
        chats: Object.keys(local.groupPrints).length,
        messages: Object.keys(local.messagePrints).length,
      }
    : null;
const DEFAULT_COMPACT_AT = 1000;
/**
 * Read positions ride along with other changes; on their own they go up at
 * most this often, so backup uploads do not become a second read-timing
 * signal next to read-state sync (D175, P60 §5).
 */
const READS_ALONE_EVERY_MS = 6 * 60 * 60_000;
/**
 * Runs one backupNow() makes while history keeps changing under it, before
 * it leaves the rest to the next scheduled run.
 */
const MAX_DRAIN_RUNS = 3;

/**
 * How a run ended: everything in the backup; a repair run queued; or
 * uploaded, but history changed while it ran (so another run is needed).
 */
type RunOutcome = "complete" | "queued" | "changed";

/** A restore's chain read so far: its segments, tip and last seq. */
interface ChainRead {
  segments: BackupSegment[];
  tip: ChainTip | null;
  after: number;
}

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
  /** Engine changes seen; a run compares it to tell history changed meanwhile. */
  private engineChanges = 0;

  /** What the chain writer needs: this manager's API, state and 404 rule. */
  private readonly chainIo: ChainWriterIo;

  constructor(deps: E2eeBackupManagerDeps) {
    this.deps = deps;
    this.chainIo = {
      api: deps.api,
      state: deps.state,
      withBackup: (request) => this.withBackup(request),
      now: () => this.now(),
    };
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
      this.engineChanges += 1;
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
      counts: countsOf(local),
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
   * upload completes. Resolves true once the new generation is active and
   * everything is uploaded; false while a queued run (a conflict or fork
   * repair) still has to finish it, with the snapshot reading as uploading
   * until it does, so callers never report the backup as on before that.
   */
  confirmBackup(prepared: PreparedBackup): Promise<boolean> {
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
      try {
        return await this.drain();
      } catch (error) {
        if (!this.isCurrentGeneration(backupId)) {
          // Gone (replaced or turned off meanwhile): nothing to carry on.
          throw error;
        }
        // The generation exists: like a failed queued run, record the
        // failure and retry. The same recovery code keeps working, and
        // backupNow() carries on with this generation instead of creating
        // another one.
        this.recordFailure(toBackupError(error));
        return false;
      }
    });
  }

  /** Read afresh: a run that finds the generation gone clears it. */
  private isCurrentGeneration(backupId: string): boolean {
    return this.local?.backupId === backupId;
  }

  /** A failed run: shown in the snapshot, retried later unless replaced. */
  private recordFailure(failure: BackupError): void {
    this.update({ lastError: failure.code });
    if (failure.code !== "E2EE_BACKUP_REPLACED") {
      this.schedule(RETRY_MS);
    }
  }

  /**
   * Runs until everything is in the backup: again while history changed
   * during a run, up to MAX_DRAIN_RUNS. False when a run is still needed
   * (a queued repair, or history that keeps changing); the snapshot then
   * reads as uploading.
   */
  private async drain(): Promise<boolean> {
    for (let run = 0; run < MAX_DRAIN_RUNS; run += 1) {
      const outcome = await this.runIncremental();
      if (outcome !== "changed") {
        return outcome === "complete";
      }
    }
    // Still changing: the run the engine's changes scheduled carries on.
    return false;
  }

  // -- incremental backup ---------------------------------------------------------

  /**
   * Uploads what changed since the last run (no-op when backup is off).
   * Resolves true once everything is in the backup, including history that
   * changed while it ran; false when nothing ran (backup off, device not
   * ready) or another run is still needed (a conflict or fork repair, or
   * history that keeps changing), so callers never report the backup as up
   * to date before that run succeeds.
   */
  backupNow(): Promise<boolean> {
    return this.serial(async () => {
      if (!this.local) {
        return false;
      }
      try {
        return await this.drain();
      } catch (error) {
        const failure = toBackupError(error);
        this.recordFailure(failure);
        throw failure;
      }
    });
  }

  /**
   * Stops the engine taking in new history (where it can), so that a
   * following backupNow() holds everything: sign-out calls this before its
   * final backup and removing local data. resumeIncoming() undoes it when
   * the data stays.
   */
  async pauseIncoming(): Promise<void> {
    await this.deps.engine.pauseIncoming?.();
  }

  resumeIncoming(): void {
    this.deps.engine.resumeIncoming?.();
  }

  /**
   * Whether history changed since `seen` (engine changes) and isn't all in
   * the backup, judged by `uploaded` (what this run uploaded). Only an
   * engine change prompts the (full) history read; a change during that
   * read counts too, since the read may predate it.
   */
  private async changedSince(
    seen: number,
    local: BackupLocalState,
    uploaded: Pick<BackupLocalState, "groupPrints" | "messagePrints">
  ): Promise<boolean> {
    const checked = this.engineChanges;
    if (checked === seen) {
      return false;
    }
    const history = await this.deps.engine.backupHistory();
    // Read positions alone do not call for another run (READS_ALONE_EVERY_MS).
    const changed = changedHistory(history, { ...local, ...uploaded }, false);
    return (
      changed.groups.length > 0 ||
      changed.messages.length > 0 ||
      this.engineChanges !== checked
    );
  }

  /** How the run ended (see RunOutcome); null when it couldn't run. */
  private async runIncremental(): Promise<RunOutcome | null> {
    const local = this.local;
    // The engine reports ready before GET /e2ee/me names this device. That
    // isn't a failure: the engine's next change schedules another run.
    if (
      !local ||
      this.deps.engine.getStatus() !== "ready" ||
      this.deps.engine.getThisDevice() === null
    ) {
      return null;
    }
    const deviceKey = this.deviceKey();
    // History is read below; engine changes after this may not be in it.
    const seenChanges = this.engineChanges;
    this.update({ busy: true });
    try {
      const segments = await this.pendingSegments(local);
      for (const [index, segment] of segments.entries()) {
        this.update({ progress: { done: index, total: segments.length } });
        if (await appendSegment(this.chainIo, local, deviceKey, segment)) {
          // The chain forked (a server without the append precondition) or
          // other devices kept appending first: the next run starts a new
          // chain with a full snapshot and compacts everything before it.
          // Until it succeeds, the backup is still being written; this
          // isn't a failure.
          this.update({ uploading: true, lastError: null });
          this.schedule(0);
          return "queued";
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
      // What this run uploaded (a compaction below starts new prints).
      const uploaded = {
        groupPrints: local.groupPrints,
        messagePrints: local.messagePrints,
      };
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
      // After the run's last request: a message that arrived at any point
      // while it ran isn't in the backup yet.
      const changed = await this.changedSince(seenChanges, local, uploaded);
      this.update({
        phase: "on",
        uploading: changed,
        lastBackupAt: local.lastBackupAt,
        lastError: null,
        usedBytes: status.used_bytes,
        quotaBytes: status.quota_bytes,
        backupCreatedAt: active.created_at,
        backupUpdatedAt: active.updated_at,
        counts: countsOf(local),
      });
      return changed ? "changed" : "complete";
    } finally {
      this.update({ busy: false, progress: null });
    }
  }

  /** What to upload this run, after catching up with the server's chain. */
  private async pendingSegments(
    local: BackupLocalState
  ): Promise<EncodedSegment[]> {
    const history = await this.deps.engine.backupHistory();
    const pack = () => {
      const changed = changedHistory(history, local, false);
      const readsDue =
        changed.groups.length > 0 ||
        changed.messages.length > 0 ||
        this.now() - (local.readsAt ?? 0) >= READS_ALONE_EVERY_MS;
      return packSegments(
        readsDue ? changedHistory(history, local, true) : changed,
        MAX_SEGMENT_BYTES,
        this.now()
      );
    };
    const segments = pack();
    if (segments.length === 0) {
      return segments;
    }
    const forked = await this.withBackup(() => catchUp(this.chainIo, local));
    if (!forked) {
      return segments;
    }
    startNewChain(local);
    await this.deps.state.put(local);
    return pack();
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
          readsSent: { ...history.reads },
          readsAt: this.now(),
        };
        await this.deps.state.put(local);
        this.local = local;
        this.update({
          phase: "on",
          lastBackupAt: local.lastBackupAt,
          lastError: null,
          counts: countsOf(local),
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
    const read: ChainRead = { segments: [], tip: null, after: 0 };
    for (;;) {
      const page = await this.deps.api.listChunks(
        backupId,
        read.after,
        LIST_PAGE
      );
      await this.readChunks({ backupId, chunkKey }, page.items, read);
      if (page.next_after_seq === null) {
        break;
      }
      if (page.items.length === 0) {
        throw new BackupError("E2EE_BACKUP_CORRUPT");
      }
    }
    const { segments, tip, after } = read;
    return {
      segments,
      chain: tip ? chainAt(tip, after) : { ...newChainState(), seq: after },
    };
  }

  /**
   * Reads the listed chunks in order into `read`, each linked after the one
   * before (so one at a time). Seqs must strictly increase; then the chunk
   * must link.
   */
  private async readChunks(
    generation: { readonly backupId: string; readonly chunkKey: CryptoKey },
    items: readonly { readonly seq: number }[],
    read: ChainRead,
    index = 0
  ): Promise<void> {
    const item = items[index];
    if (!item) {
      return;
    }
    const linked: LinkedChunk | null =
      item.seq > read.after
        ? await linkListed(
            this.deps.api,
            generation,
            read.tip,
            item.seq,
            "restore"
          )
        : null;
    if (!linked) {
      throw new BackupError("E2EE_BACKUP_CORRUPT");
    }
    read.tip = linked.tip;
    read.after = item.seq;
    read.segments.push(decodeSegment(linked.json));
    await this.readChunks(generation, items, read, index + 1);
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
