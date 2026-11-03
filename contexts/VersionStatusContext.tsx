"use client";

import {
  useIsVersionStale,
  useVersionPreviewFlag,
} from "@/hooks/useIsVersionStale";
import { prepareVersionReloadImage } from "@/components/version-update/versionReload";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

const VersionStatusContext = createContext(false);

export function VersionStatusProvider({
  children,
  enabled = true,
}: {
  readonly children: ReactNode;
  readonly enabled?: boolean;
}) {
  // Unknown until the reader below renders. It reads search params, so it sits
  // in its own Suspense boundary: a prerendered page can render this provider
  // and its children without the query.
  const [forcePreview, setForcePreview] = useState<boolean | null>(null);
  const isVersionStale = useIsVersionStale(undefined, enabled, forcePreview);
  useEffect(() => {
    if (isVersionStale) void prepareVersionReloadImage();
  }, [isVersionStale]);
  return (
    <VersionStatusContext.Provider value={isVersionStale}>
      <Suspense fallback={null}>
        <VersionPreviewFlagReader onChange={setForcePreview} />
      </Suspense>
      {children}
    </VersionStatusContext.Provider>
  );
}

function VersionPreviewFlagReader({
  onChange,
}: {
  readonly onChange: (forcePreview: boolean) => void;
}) {
  const forcePreview = useVersionPreviewFlag();
  // Before paint, so a forced preview shows in the same frame the flag arrives.
  useLayoutEffect(() => {
    onChange(forcePreview);
  }, [forcePreview, onChange]);
  return null;
}

export const useVersionStatus = () => useContext(VersionStatusContext);
