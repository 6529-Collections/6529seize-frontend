import type { MessageKey } from "@/i18n/messages";
import { backupErrorCode } from "@/lib/e2ee/backup/errors";

const BACKUP_ERROR_KEYS: Record<string, MessageKey> = {
  E2EE_BACKUP_CODE_FORMAT: "e2ee.backup.error.codeFormat",
  E2EE_BACKUP_WRONG_CODE: "e2ee.backup.error.wrongCode",
  E2EE_BACKUP_NONE: "e2ee.backup.error.none",
  E2EE_BACKUP_CORRUPT: "e2ee.backup.error.corrupt",
  E2EE_BACKUP_REPLACED: "e2ee.backup.error.replaced",
  E2EE_BACKUP_QUOTA: "e2ee.backup.error.quota",
  E2EE_BACKUP_NOT_READY: "e2ee.backup.error.notReady",
  E2EE_RATE_LIMITED: "e2ee.backup.error.rateLimited",
};

/** Copy for a backup error code (or a thrown error). */
export function getBackupErrorKey(error: unknown): MessageKey {
  const code = typeof error === "string" ? error : backupErrorCode(error);
  return (
    (code ? BACKUP_ERROR_KEYS[code] : undefined) ?? "e2ee.backup.error.generic"
  );
}
