"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";

const getWaveFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const wave = url.searchParams.get("wave");
  return typeof wave === "string" ? wave : null;
};

/**
 * Client-side active wave state that keeps the URL in sync without
 * triggering a Next.js router navigation (avoids per-click server trips).
 */
export function useActiveWaveManager() {
  const { isApp } = useDeviceInfo();
  const [activeWaveId, setActiveWaveId] = useState<string | null>(() =>
    getWaveFromUrl()
  );

  // Sync with back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setActiveWaveId(getWaveFromUrl());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setActiveWave = useCallback(
    (
      waveId: string | null,
      options?: { isDirectMessage?: boolean; replace?: boolean; event?: MouseEvent }
    ) => {
      if (typeof window === "undefined") return;

      const isDirectMessage = options?.isDirectMessage ?? false;
      const target = waveId
        ? getWaveRoute({ waveId, isDirectMessage, isApp })
        : getWaveHomeRoute({ isDirectMessage, isApp });

      const method = options?.replace ? "replaceState" : "pushState";
      // Only update history if the URL actually changes
      if (window.location.pathname + window.location.search !== target) {
        window.history[method](null, "", target);
      }
      setActiveWaveId(waveId);
    },
    [isApp]
  );

  return {
    activeWaveId,
    setActiveWave,
  };
}
