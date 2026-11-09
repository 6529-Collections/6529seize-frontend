"use client";

import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useE2eeBackup } from "@/hooks/e2ee/useE2eeBackup";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useE2eeNow } from "../useE2eeNow";
import { BackupSetupLink } from "./BackupSetupLink";
import { snoozeBackupNudge, useBackupNudgeState } from "./backupNudgeStorage";

/**
 * The encrypted inbox's reminder while backup is off (or a backup from
 * another device isn't restored here). "Remind me" hides it for 7 days,
 * then 30; it never blocks reading or sending.
 */
export function BackupNudgeBanner({
  className = "",
}: {
  readonly className?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const titleId = useId();
  const { status, profileId } = useE2ee();
  const { snapshot } = useE2eeBackup();
  const nudge = useBackupNudgeState(profileId);
  const now = useE2eeNow();
  const phase = snapshot?.phase;

  if (
    status !== "ready" ||
    !profileId ||
    (phase !== "off" && phase !== "available") ||
    nudge.snoozedUntil > now
  ) {
    return null;
  }
  const restore = phase === "available";
  return (
    <section
      aria-labelledby={titleId}
      className={`tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/5 tw-p-3 sm:tw-flex-row sm:tw-items-center ${className}`}
    >
      <ArchiveBoxArrowDownIcon
        aria-hidden="true"
        className="tw-hidden tw-size-5 tw-shrink-0 tw-text-amber-300 sm:tw-block"
      />
      <div className="tw-min-w-0 tw-flex-1">
        <p
          id={titleId}
          className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50"
        >
          {t(
            locale,
            restore ? "e2ee.backupNudge.restoreTitle" : "e2ee.backupNudge.title"
          )}
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(
            locale,
            restore ? "e2ee.backupNudge.restoreBody" : "e2ee.backupNudge.body"
          )}
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <BackupSetupLink>
          {t(
            locale,
            restore ? "e2ee.backup.action.restore" : "e2ee.backup.action.turnOn"
          )}
        </BackupSetupLink>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => snoozeBackupNudge(profileId, Date.now())}
        >
          {t(
            locale,
            nudge.snoozes === 0
              ? "e2ee.backupNudge.snoozeWeek"
              : "e2ee.backupNudge.snoozeMonth"
          )}
        </Button>
      </div>
    </section>
  );
}
