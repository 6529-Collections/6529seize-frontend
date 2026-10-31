/**
 * Backup error codes (the UI maps them to copy; the backup module never
 * returns user-visible strings).
 */
type BackupErrorCode =
  | "E2EE_BACKUP_CODE_FORMAT" // malformed or mistyped recovery code
  | "E2EE_BACKUP_WRONG_CODE" // well formed, but does not open this backup
  | "E2EE_BACKUP_NONE" // no backup to restore
  | "E2EE_BACKUP_CORRUPT" // undecryptable or malformed backup data
  | "E2EE_BACKUP_SEGMENT_TOO_LARGE"
  | "E2EE_BACKUP_NOT_READY" // encrypted messages are not set up here
  | "E2EE_BACKUP_REPLACED"; // turned off or replaced on another device

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(code: BackupErrorCode) {
    super(code);
    this.name = "BackupError";
    this.code = code;
  }
}

export const backupErrorCode = (error: unknown): string | null => {
  if (error instanceof BackupError) {
    return error.code;
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
};
