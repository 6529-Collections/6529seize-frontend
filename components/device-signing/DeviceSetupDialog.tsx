"use client";

import { useState } from "react";
import { E2eeEnrollmentCard } from "@/components/e2ee/gate/E2eeEnrollmentCard";
import { E2eeEnrollmentIdentity } from "@/components/e2ee/gate/E2eeEnrollmentIdentity";
import { E2eeDialog } from "@/components/e2ee/ui/E2eeDialog";
import { useE2eeUpgradeCount } from "@/components/e2ee/useE2eeUpgrade";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getDeviceSetupTitleKey, type DeviceSetupScope } from "./deviceSetup";

export default function DeviceSetupDialog({
  onClose,
  scope: initialScope,
}: {
  readonly onClose: () => void;
  readonly scope: DeviceSetupScope;
}) {
  const locale = useBrowserLocale();
  const e2ee = useE2ee();
  const [scope, setScope] = useState(initialScope);
  const upgrading = useE2eeUpgradeCount(e2ee.engine) !== null;
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
        onClose={onClose}
        onScopeChange={setScope}
      />
    </E2eeDialog>
  );
}
