"use client";

import { useState } from "react";
import { BackupSetupLink } from "@/components/e2ee/backup/BackupSetupLink";
import { E2eeEnrollmentCard } from "@/components/e2ee/gate/E2eeEnrollmentCard";
import { E2eeEnrollmentIdentity } from "@/components/e2ee/gate/E2eeEnrollmentIdentity";
import { E2eeDialog } from "@/components/e2ee/ui/E2eeDialog";
import { useE2eeUpgradeCount } from "@/components/e2ee/useE2eeUpgrade";
import Button from "@/components/utils/button/Button";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useE2eeBackup } from "@/hooks/e2ee/useE2eeBackup";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getDeviceSetupTitleKey, type DeviceSetupScope } from "./deviceSetup";

/**
 * Setup's last step once encrypted DMs are on here and backup isn't:
 * "One more step: back up your messages" (restore when a backup exists).
 */
function BackupNextStep({
  scope,
  restore,
  onClose,
}: {
  readonly scope: DeviceSetupScope;
  readonly restore: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { thisDevice } = useE2ee();
  return (
    <E2eeDialog
      open
      title={t(
        locale,
        scope === "both"
          ? "e2ee.setupDone.titleBoth"
          : "e2ee.setupDone.titleDms"
      )}
      description={
        thisDevice
          ? t(locale, "e2ee.setupDone.until", {
              date: formatDate(locale, thisDevice.expiresAt),
            })
          : undefined
      }
      closeLabel={t(locale, "e2ee.action.close")}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose}>
            {t(locale, "e2ee.setupDone.later")}
          </Button>
          <BackupSetupLink onNavigate={onClose}>
            {t(
              locale,
              restore
                ? "e2ee.backup.action.restore"
                : "e2ee.backup.action.turnOn"
            )}
          </BackupSetupLink>
        </>
      }
    >
      <div className="tw-flex tw-flex-col tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-amber-500/30 tw-bg-amber-500/5 tw-p-3">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
          {t(
            locale,
            restore ? "e2ee.setupDone.restoreTitle" : "e2ee.setupDone.backupTitle"
          )}
        </p>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            locale,
            restore ? "e2ee.setupDone.restoreBody" : "e2ee.setupDone.backupBody"
          )}
        </p>
      </div>
    </E2eeDialog>
  );
}

export default function DeviceSetupDialog({
  onClose,
  scope: initialScope,
}: {
  readonly onClose: () => void;
  readonly scope: DeviceSetupScope;
}) {
  const locale = useBrowserLocale();
  const e2ee = useE2ee();
  const { manager } = useE2eeBackup();
  const [scope, setScope] = useState(initialScope);
  const [nextStep, setNextStep] = useState<"backup" | "restore" | null>(null);
  const upgrading = useE2eeUpgradeCount(e2ee.engine) !== null;

  // The card closes itself on success and on Cancel; only a success that
  // turned encrypted DMs on here, with backup not on, gets the last step.
  const closeCard = () => {
    const encryptedNow =
      scope !== "posts" && e2ee.engine?.getStatus() === "ready";
    const phase = manager?.getSnapshot().phase ?? null;
    if (encryptedNow && phase !== "on") {
      setNextStep(phase === "available" ? "restore" : "backup");
      return;
    }
    onClose();
  };

  if (nextStep) {
    return (
      <BackupNextStep
        scope={scope}
        restore={nextStep === "restore"}
        onClose={onClose}
      />
    );
  }
  return (
    <E2eeDialog
      open
      title={t(locale, getDeviceSetupTitleKey(scope, upgrading))}
      closeLabel={t(locale, "signedMessages.notice.dismiss")}
      onClose={onClose}
      size="md"
      hideCloseButton
      scrollBody
    >
      <E2eeEnrollmentCard
        scope={scope}
        engine={e2ee.engine}
        encryptionLoading={e2ee.status === "loading" || e2ee.status === "idle"}
        enrolling={e2ee.status === "enrolling"}
        engineError={e2ee.error}
        details={<E2eeEnrollmentIdentity />}
        onClose={closeCard}
        onScopeChange={setScope}
      />
    </E2eeDialog>
  );
}
