"use client";

import {
  getActiveWaveIdFromUrl,
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface WaveNavigationOptions {
  isDirectMessage?: boolean | undefined;
  serialNo?: number | string | null | undefined;
  divider?: number | null | undefined;
}

const getWaveFromWindow = (): string | null => {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  return getActiveWaveIdFromUrl({
    pathname: url.pathname,
    searchParams: url.searchParams,
  });
};

const getRouteContext = (): { isOnWaves: boolean; isOnMessages: boolean } => {
  if (typeof window === "undefined") {
    return { isOnWaves: false, isOnMessages: false };
  }

  const pathname = window.location.pathname;
  return {
    isOnWaves: pathname === "/waves" || pathname.startsWith("/waves/"),
    isOnMessages: pathname === "/messages" || pathname.startsWith("/messages/"),
  };
};

export function useActiveWaveManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();

  const waveFromLocation = useMemo(
    () =>
      getActiveWaveIdFromUrl({
        pathname,
        searchParams,
      }),
    [pathname, searchParams]
  );
  const hasActiveWaveDropTarget = useMemo(() => {
    const serialNo = searchParams.get("serialNo")?.trim() ?? "";
    const drop = searchParams.get("drop")?.trim() ?? "";
    return serialNo.length > 0 || drop.length > 0;
  }, [searchParams]);

  const buildUrl = useCallback(
    (waveId: string | null, options?: WaveNavigationOptions) => {
      const isDirectMessage = options?.isDirectMessage ?? false;
      const serialNo = options?.serialNo ?? undefined;
      const divider = options?.divider;
      return waveId
        ? getWaveRoute({
            waveId,
            serialNo,
            extraParams: {
              divider:
                divider !== null && divider !== undefined
                  ? String(divider)
                  : undefined,
            },
            isDirectMessage,
            isApp,
          })
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
    initialState: waveFromLocation,
    buildUrl,
    parseUrl: getWaveFromWindow,
    canUsePushState,
  });

  return {
    activeWaveId,
    hasActiveWaveDropTarget,
    setActiveWave,
  };
}
