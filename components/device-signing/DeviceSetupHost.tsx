"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { E2eeEnrollmentCard } from "@/components/e2ee/gate/E2eeEnrollmentCard";
import { E2eeEnrollmentIdentity } from "@/components/e2ee/gate/E2eeEnrollmentIdentity";
import { E2eeDialog } from "@/components/e2ee/ui/E2eeDialog";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  DEVICE_SETUP_EVENT,
  DEVICE_SETUP_TITLE,
  type DeviceSetupScope,
} from "./deviceSetup";

function DeviceSetupDialog({
  onClose,
  scope: initialScope,
}: {
  readonly onClose: () => void;
  readonly scope: DeviceSetupScope;
}) {
  const locale = useBrowserLocale();
  const e2ee = useE2ee();
  const [scope, setScope] = useState(initialScope);
  return (
    <E2eeDialog
      open
      title={t(locale, DEVICE_SETUP_TITLE[scope])}
      closeLabel={t(locale, "signedMessages.notice.dismiss")}
      onClose={onClose}
      size="md"
      hideCloseButton
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

export default function DeviceSetupHost() {
  const { isAuthenticated, activeProfileProxy, connectedProfile } = useAuth();
  const { address: account } = useSeizeConnectContext();
  const session =
    isAuthenticated && !activeProfileProxy && account
      ? `${connectedProfile?.id ?? ""}:${account.toLowerCase()}`
      : null;
  const [previousSession, setPreviousSession] = useState(session);
  const [request, setRequest] = useState<{
    readonly scope: DeviceSetupScope;
  } | null>(null);
  if (session !== previousSession) {
    setPreviousSession(session);
    setRequest(null);
  }
  useEffect(() => {
    const open = (event: Event) => {
      if (session) {
        setRequest({
          scope: (event as CustomEvent<DeviceSetupScope>).detail,
        });
      }
    };
    window.addEventListener(DEVICE_SETUP_EVENT, open);
    return () => window.removeEventListener(DEVICE_SETUP_EVENT, open);
  }, [session]);
  if (!session || !request) return null;
  return (
    <DeviceSetupDialog
      key={session}
      scope={request.scope}
      onClose={() => setRequest(null)}
    />
  );
}
