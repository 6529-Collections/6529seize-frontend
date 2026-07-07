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

const LOCATION_STATE_CHANGE_EVENT = "6529-location-state-change";
type LocationStatePatch = {
  subscribers: number;
  originalPushState: History["pushState"];
  originalReplaceState: History["replaceState"];
  patchedPushState: History["pushState"];
  patchedReplaceState: History["replaceState"];
};

type LocationStatePatchedWindow = Window & {
  __locationStatePatch?: LocationStatePatch | undefined;
};

const getWaveFromWindow = (): string | null => {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  return getActiveWaveIdFromUrl({
    pathname: url.pathname,
    searchParams: url.searchParams,
  });
};

const getLocationSearch = (): string => globalThis.window?.location.search ?? "";

const ensureLocationStateEvents = (
  browserWindow: Window
): (() => void) => {
  const patchedWindow = browserWindow as LocationStatePatchedWindow;
  let patch = patchedWindow.__locationStatePatch;
  if (!patch) {
    const originalPushState = browserWindow.history.pushState;
    const originalReplaceState = browserWindow.history.replaceState;
    const patchedPushState = function patchedPushState(
      this: History,
      ...args: Parameters<History["pushState"]>
    ) {
      const result = originalPushState.apply(this, args);
      browserWindow.dispatchEvent(new Event(LOCATION_STATE_CHANGE_EVENT));
      return result;
    } as History["pushState"];
    const patchedReplaceState = function patchedReplaceState(
      this: History,
      ...args: Parameters<History["replaceState"]>
    ) {
      const result = originalReplaceState.apply(this, args);
      browserWindow.dispatchEvent(new Event(LOCATION_STATE_CHANGE_EVENT));
      return result;
    } as History["replaceState"];

    patch = {
      subscribers: 0,
      originalPushState,
      originalReplaceState,
      patchedPushState,
      patchedReplaceState,
    };
    patchedWindow.__locationStatePatch = patch;

    browserWindow.history.pushState = patchedPushState;
    browserWindow.history.replaceState = patchedReplaceState;
  }

  patch.subscribers += 1;

  return () => {
    const patch = patchedWindow.__locationStatePatch;
    if (!patch) {
      return;
    }

    patch.subscribers -= 1;
    if (patch.subscribers > 0) {
      return;
    }

    if (browserWindow.history.pushState === patch.patchedPushState) {
      browserWindow.history.pushState = patch.originalPushState;
    }
    if (browserWindow.history.replaceState === patch.patchedReplaceState) {
      browserWindow.history.replaceState = patch.originalReplaceState;
    }
    delete patchedWindow.__locationStatePatch;
  };
};

const subscribeLocationSearch = (onStoreChange: () => void): (() => void) => {
  const browserWindow = globalThis.window;
  if (browserWindow === undefined) {
    return () => undefined;
  }

  const cleanupLocationStateEvents = ensureLocationStateEvents(browserWindow);
  browserWindow.addEventListener("popstate", onStoreChange);
  browserWindow.addEventListener(LOCATION_STATE_CHANGE_EVENT, onStoreChange);
  return () => {
    browserWindow.removeEventListener("popstate", onStoreChange);
    browserWindow.removeEventListener(
      LOCATION_STATE_CHANGE_EVENT,
      onStoreChange
    );
    cleanupLocationStateEvents();
  };
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
