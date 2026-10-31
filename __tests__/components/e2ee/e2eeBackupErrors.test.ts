import { getBackupErrorKey } from "@/components/e2ee/backup/e2eeBackupErrors";
import { t } from "@/i18n/messages";
import { E2eeApiError } from "@/lib/e2ee/api";
import {
  BackupError,
  backupErrorCode,
  toBackupError,
} from "@/lib/e2ee/backup/errors";

const apiError = (status: number, code: string) =>
  new E2eeApiError({ message: code, status, code });

describe("backup failure codes", () => {
  it("passes the explained server codes through and folds the rest into E2EE_BACKUP_FAILED", () => {
    expect(backupErrorCode(apiError(413, "E2EE_BACKUP_QUOTA"))).toBe(
      "E2EE_BACKUP_QUOTA"
    );
    expect(backupErrorCode(apiError(429, "E2EE_RATE_LIMITED"))).toBe(
      "E2EE_RATE_LIMITED"
    );
    expect(backupErrorCode(apiError(500, "E2EE_SOMETHING"))).toBe(
      "E2EE_BACKUP_FAILED"
    );
    expect(backupErrorCode(new Error("boom"))).toBe("E2EE_BACKUP_FAILED");
    expect(backupErrorCode({ code: "E2EE_BACKUP_QUOTA" })).toBe(
      "E2EE_BACKUP_FAILED"
    );
    expect(backupErrorCode(new BackupError("E2EE_BACKUP_WRONG_CODE"))).toBe(
      "E2EE_BACKUP_WRONG_CODE"
    );
    expect(toBackupError(apiError(413, "E2EE_BACKUP_QUOTA"))).toMatchObject({
      name: "BackupError",
      code: "E2EE_BACKUP_QUOTA",
    });
  });

  it("maps snapshot codes and thrown errors to their specific copy", () => {
    expect(getBackupErrorKey("E2EE_BACKUP_QUOTA")).toBe(
      "e2ee.backup.error.quota"
    );
    expect(getBackupErrorKey("E2EE_RATE_LIMITED")).toBe(
      "e2ee.backup.error.rateLimited"
    );
    expect(getBackupErrorKey(apiError(413, "E2EE_BACKUP_QUOTA"))).toBe(
      "e2ee.backup.error.quota"
    );
    expect(getBackupErrorKey(new BackupError("E2EE_BACKUP_WRONG_CODE"))).toBe(
      "e2ee.backup.error.wrongCode"
    );
    expect(getBackupErrorKey("not-a-code")).toBe("e2ee.backup.error.generic");
    expect(t("en-US", getBackupErrorKey("E2EE_BACKUP_QUOTA"))).not.toBe(
      t("en-US", "e2ee.backup.error.generic")
    );
  });
});
