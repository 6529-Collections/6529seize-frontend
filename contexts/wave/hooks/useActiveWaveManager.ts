"use client";

import { useCallback, useEffect, useState } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";

const getWaveFromUrl = (): string | null => {
  const currentWindow = globalThis.window;
  if (!currentWindow) return null;
  const url = new URL(currentWindow.location.href);
  const wave = url.searchParams.get("wave");
  return typeof wave === "string" ? wave : null;
};

/**
 * Client-side active wave state that keeps the URL in sync without
 * triggering a Next.js router navigation (avoids per-click server trips).
 */
export function useActiveWaveManager() {
  const { isApp } = useDeviceInfo();
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null);

  // Sync with back/forward navigation
  useEffect(() => {
    const currentWindow = globalThis.window;
    if (!currentWindow) return;

    setActiveWaveId(getWaveFromUrl());

    const onPopState = () => {
      setActiveWaveId(getWaveFromUrl());
    };
    currentWindow.addEventListener("popstate", onPopState);
    return () => currentWindow.removeEventListener("popstate", onPopState);
  }, []);

  const setActiveWave = useCallback(
    (
      waveId: string | null,
      options?: { isDirectMessage?: boolean; replace?: boolean }
    ) => {
      const currentWindow = globalThis.window;
      if (!currentWindow) return;

      const isDirectMessage = options?.isDirectMessage ?? false;
      const target = waveId
        ? getWaveRoute({ waveId, isDirectMessage, isApp })
        : getWaveHomeRoute({ isDirectMessage, isApp });

      const method = options?.replace ? "replaceState" : "pushState";
      // Only update history if the URL actually changes
      if (
        currentWindow.location.pathname + currentWindow.location.search !==
        target
      ) {
        currentWindow.history[method](null, "", target);
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
