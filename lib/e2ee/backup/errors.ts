import { asE2eeApiError } from "../api";

/**
 * Backup failure codes. The UI maps them to copy; the backup module never
 * returns user-visible strings.
 */
type BackupLocalErrorCode =
  | "E2EE_BACKUP_CODE_FORMAT" // malformed or mistyped recovery code
  | "E2EE_BACKUP_WRONG_CODE" // well formed, but does not open this backup
  | "E2EE_BACKUP_NONE" // no backup to restore
  | "E2EE_BACKUP_CORRUPT" // undecryptable or malformed backup data
  | "E2EE_BACKUP_SEGMENT_TOO_LARGE"
  | "E2EE_BACKUP_NOT_READY" // encrypted messages are not set up here
  | "E2EE_BACKUP_REPLACED"; // turned off or replaced on another device

/** Server codes the backup UI explains specifically (from E2eeApiError). */
const BACKUP_API_ERROR_CODES = [
  "E2EE_BACKUP_QUOTA", // 413: the profile's backup storage is full
  "E2EE_RATE_LIMITED", // 429: daily chunk or byte budget used up
] as const;

type BackupApiErrorCode = (typeof BACKUP_API_ERROR_CODES)[number];

export type BackupFailureCode =
  | BackupLocalErrorCode
  | BackupApiErrorCode
  /** Anything else (network, server error, unexpected response). */
  | "E2EE_BACKUP_FAILED";

const isApiCode = (code: string): code is BackupApiErrorCode =>
  (BACKUP_API_ERROR_CODES as readonly string[]).includes(code);

export class BackupError extends Error {
  readonly code: BackupFailureCode;

  constructor(code: BackupFailureCode) {
    super(code);
    this.name = "BackupError";
    this.code = code;
  }
}

/**
 * The failure code of a thrown error: backup codes as they are, the server
 * codes listed above passed through from E2eeApiError, and
 * E2EE_BACKUP_FAILED for everything else.
 */
export function backupErrorCode(error: unknown): BackupFailureCode {
  if (error instanceof BackupError) {
    return error.code;
  }
  const apiCode = asE2eeApiError(error)?.code;
  if (apiCode && isApiCode(apiCode)) {
    return apiCode;
  }
  return "E2EE_BACKUP_FAILED";
}

/** Normalizes any failure into a BackupError carrying its failure code. */
export const toBackupError = (error: unknown): BackupError =>
  error instanceof BackupError
    ? error
    : new BackupError(backupErrorCode(error));
