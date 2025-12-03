"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";

interface WaveNavigationOptions {
  isDirectMessage?: boolean;
}

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
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();

  const waveFromSearchParams = useMemo(() => {
    const waveId = searchParams?.get("wave");
    return typeof waveId === "string" ? waveId : null;
  }, [searchParams]);

  const buildUrl = useCallback(
    (waveId: string | null, options?: WaveNavigationOptions) => {
      const isDirectMessage = options?.isDirectMessage ?? false;
      return waveId
        ? getWaveRoute({ waveId, isDirectMessage, isApp })
        : getWaveHomeRoute({ isDirectMessage, isApp });
    },
    [isApp]
  );

  const canUsePushState = useCallback(
    (_targetUrl: string, options?: WaveNavigationOptions) => {
      const { isOnWaves, isOnMessages } = getRouteContext();
      const isDirectMessage = options?.isDirectMessage ?? false;
      return (
        (!isDirectMessage && isOnWaves) || (isDirectMessage && isOnMessages)
      );
    },
    []
  );

  const { state: activeWaveId, navigate: setActiveWave } = useClientNavigation<
    string | null,
    WaveNavigationOptions
  >({
    initialState: waveFromSearchParams,
    buildUrl,
    parseUrl: getWaveFromWindow,
    canUsePushState,
  });

  return {
    activeWaveId,
    setActiveWave,
  };
}
