"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";

const getWaveFromWindow = (): string | null => {
  if (globalThis.window === undefined) return null;

  const url = new URL(globalThis.window.location.href);
  const wave = url.searchParams.get("wave");
  return typeof wave === "string" ? wave : null;
};


const getRouteContext = (): { isOnWaves: boolean; isOnMessages: boolean } => {
  if (globalThis.window === undefined) {
    return { isOnWaves: false, isOnMessages: false };
  }

  const pathname = globalThis.window.location.pathname;
  return {
    isOnWaves: pathname === "/waves" || pathname.startsWith("/waves/"),
    isOnMessages: pathname === "/messages" || pathname.startsWith("/messages/"),
  };
};

export function useActiveWaveManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();

  const waveFromSearchParams = useMemo(() => {
    const waveId = searchParams?.get("wave");
    return typeof waveId === "string" ? waveId : null;
  }, [searchParams]);

  // Track state for pushState updates
  const [activeWaveId, setActiveWaveId] = useState<string | null>(waveFromSearchParams);

  // Sync state when searchParams change (after router.push navigation)
  useEffect(() => {
    setActiveWaveId(waveFromSearchParams);
  }, [waveFromSearchParams]);

  // Sync with back/forward navigation
  useEffect(() => {
    if (globalThis.window === undefined) return;

    const { window: browserWindow } = globalThis;
    if (!browserWindow) return;

    const onPopState = () => {
      setActiveWaveId(getWaveFromWindow());
    };
    browserWindow.addEventListener("popstate", onPopState);
    return () => browserWindow.removeEventListener("popstate", onPopState);
  }, []);

  const setActiveWave = useCallback(
    (
      waveId: string | null,
      options?: { isDirectMessage?: boolean; replace?: boolean }
    ) => {
      if (globalThis.window === undefined) return;

      const { window: browserWindow } = globalThis;
      if (!browserWindow) return;
      const isDirectMessage = options?.isDirectMessage ?? false;

      const target = waveId
        ? getWaveRoute({ waveId, isDirectMessage, isApp })
        : getWaveHomeRoute({ isDirectMessage, isApp });

      const currentUrl = browserWindow.location.pathname + browserWindow.location.search;
      if (currentUrl === target) {
        setActiveWaveId(waveId);
        return;
      }

      // Check if staying on same route type (waves→waves or messages→messages)
      const { isOnWaves, isOnMessages } = getRouteContext();
      const canUsePushState =
        (!isDirectMessage && isOnWaves) || (isDirectMessage && isOnMessages);

      if (canUsePushState) {
        // Same route - fast pushState
        const method = options?.replace ? "replaceState" : "pushState";
        browserWindow.history[method](null, "", target);
        setActiveWaveId(waveId);
      } else if (options?.replace) {
        router.replace(target);
      } else {
        // Cross-route - proper navigation
        router.push(target);
      }
    },
    [isApp, router]
  );

  return {
    activeWaveId,
    setActiveWave,
  };
}
