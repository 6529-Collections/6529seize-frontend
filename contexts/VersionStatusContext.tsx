"use client";

import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import { createContext, useContext, type ReactNode } from "react";

const VersionStatusContext = createContext(false);

export function VersionStatusProvider({
  children,
  enabled = true,
}: {
  readonly children: ReactNode;
  readonly enabled?: boolean;
}) {
  const isVersionStale = useIsVersionStale(undefined, enabled);
  return (
    <VersionStatusContext.Provider value={isVersionStale}>
      {children}
    </VersionStatusContext.Provider>
  );
}

export const useVersionStatus = () => useContext(VersionStatusContext);
