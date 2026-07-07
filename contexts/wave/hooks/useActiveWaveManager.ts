"use client";

import {
  getActiveWaveIdFromUrl,
  getWaveHomeRoute,
  getWaveRoute,
} from "@/helpers/navigation.helpers";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";

interface WaveNavigationOptions {
  isDirectMessage?: boolean | undefined;
  serialNo?: number | string | null | undefined;
  divider?: number | null | undefined;
}

const getWaveFromWindow = (): string | null => {
  if (globalThis.window === undefined) return null;

  const url = new URL(globalThis.window.location.href);
  return getActiveWaveIdFromUrl({
    pathname: url.pathname,
    searchParams: url.searchParams,
  });
};

const getLocationSearch = (): string => globalThis.window?.location.search ?? "";

const subscribeLocationSearch = (onStoreChange: () => void): (() => void) => {
  const browserWindow = globalThis.window;
  if (browserWindow === undefined) {
    return () => undefined;
  }

  browserWindow.addEventListener("popstate", onStoreChange);
  return () => {
    browserWindow.removeEventListener("popstate", onStoreChange);
  };
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
  const pathname = usePathname();
  const search = useSyncExternalStore(
    subscribeLocationSearch,
    getLocationSearch,
    () => ""
  );
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const { isApp } = useDeviceInfo();

  const waveFromLocation = useMemo(
    () =>
      getActiveWaveIdFromUrl({
        pathname,
        searchParams,
      }),
    [pathname, searchParams]
  );

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
    setActiveWave,
  };
}
