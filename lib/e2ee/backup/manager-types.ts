import type { E2eeDeviceInfo, E2eeEngineStatus } from "../types";
import type { E2eeBackupApi } from "./api";
import type { BackupFailureCode } from "./errors";
import type { BackupHistory } from "./format";
import type { BackupStateStore } from "./state";

// The backup manager's public shapes and its dependencies.

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

export interface BackupScheduler {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface E2eeBackupManagerDeps {
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
