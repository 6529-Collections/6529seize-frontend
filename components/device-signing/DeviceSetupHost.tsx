"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { DEVICE_SETUP_EVENT, type DeviceSetupScope } from "./deviceSetup";

const DeviceSetupDialog = dynamic(() => import("./DeviceSetupDialog"), {
  ssr: false,
});

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
