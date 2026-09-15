"use client";

import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import { prepareVersionReloadImage } from "@/components/version-update/versionReload";
import { createContext, useContext, useEffect, type ReactNode } from "react";

const VersionStatusContext = createContext(false);

export function VersionStatusProvider({
  children,
  enabled = true,
}: {
  readonly children: ReactNode;
  readonly enabled?: boolean;
}) {
  const isVersionStale = useIsVersionStale(undefined, enabled);
  useEffect(() => {
    if (isVersionStale) void prepareVersionReloadImage();
  }, [isVersionStale]);
  return (
    <VersionStatusContext.Provider value={isVersionStale}>
      {children}
    </VersionStatusContext.Provider>
  );
}

export const useVersionStatus = () => useContext(VersionStatusContext);
