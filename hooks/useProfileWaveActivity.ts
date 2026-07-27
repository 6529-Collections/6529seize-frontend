"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";

const PROFILE_WAVE_ACTIVITY_STALE_TIME_MS = 5 * 60_000;

const combineProfileWaveActivityTimestamps = (
  results: readonly { readonly data?: ApiDrop[] | undefined }[]
): readonly (number | null)[] =>
  results.map(({ data }) => data?.[0]?.created_at ?? null);

const getBrowserWindow = (): Window | undefined =>
  (globalThis as { readonly window?: Window }).window;

const getDesktopViewportSnapshot = (): boolean => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return false;
  }

  return browserWindow.matchMedia(`(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`)
    .matches;
};

const subscribeToDesktopViewport = (
  onStoreChange: () => void
): (() => void) => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return () => undefined;
  }

  const mediaQuery = browserWindow.matchMedia(
    `(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`
  );
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const useDeferredActivityKey = (
  activityKey: string,
  enabled: boolean
): boolean => {
  const [readyActivityKey, setReadyActivityKey] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || readyActivityKey === activityKey) {
      return;
    }

    if (typeof globalThis.requestIdleCallback === "function") {
      const callbackId = globalThis.requestIdleCallback(
        () => setReadyActivityKey(activityKey),
        { timeout: 1500 }
      );
      return () => globalThis.cancelIdleCallback(callbackId);
    }

    const timeoutId = globalThis.setTimeout(
      () => setReadyActivityKey(activityKey),
      250
    );
    return () => globalThis.clearTimeout(timeoutId);
  }, [activityKey, enabled, readyActivityKey]);

  return enabled && readyActivityKey === activityKey;
};

export function useProfileWaveActivity({
  identity,
  waveIds,
  enabled = true,
}: {
  readonly identity: string | null;
  readonly waveIds: readonly string[];
  readonly enabled?: boolean | undefined;
}): ReadonlyMap<string, number> {
  const { connectedProfile } = useAuth();
  const isDesktopViewport = useSyncExternalStore(
    subscribeToDesktopViewport,
    getDesktopViewportSnapshot,
    () => false
  );
  const normalizedIdentity = identity?.toLowerCase() ?? "";
  const uniqueWaveIds = useMemo(
    () => Array.from(new Set(waveIds.filter(Boolean))),
    [waveIds]
  );
  const activityKey = `${normalizedIdentity}:${uniqueWaveIds.join(",")}`;
  const shouldFetch = useDeferredActivityKey(
    activityKey,
    enabled && isDesktopViewport && normalizedIdentity.length > 0
  );

  // Favourite waves include the rank, but not the viewed profile's latest
  // post timestamp. Fetch one drop per wave only after the desktop UI settles.
  const activityTimestamps = useQueries({
    queries: uniqueWaveIds.map((waveId) => ({
      queryKey: [
        QueryKey.PROFILE_DROPS,
        {
          handleOrWallet: normalizedIdentity,
          wave_id: waveId,
          limit: 1,
          context_profile: connectedProfile?.handle ?? null,
        },
      ],
      queryFn: async () => {
        const params: Record<string, string> = {
          limit: "1",
          author: normalizedIdentity,
          include_replies: "true",
          wave_id: waveId,
        };
        if (connectedProfile?.handle) {
          params["context_profile"] = connectedProfile.handle;
        }
        return await commonApiFetch<ApiDrop[]>({
          endpoint: "drops",
          params,
        });
      },
      enabled: shouldFetch,
      staleTime: PROFILE_WAVE_ACTIVITY_STALE_TIME_MS,
      // This is secondary profile context: cap it at one request per wave.
      retry: false,
      refetchOnWindowFocus: false,
    })),
    combine: combineProfileWaveActivityTimestamps,
  });

  return useMemo(() => {
    const activityByWaveId = new Map<string, number>();

    uniqueWaveIds.forEach((waveId, index) => {
      const timestamp = activityTimestamps[index];
      if (timestamp !== null && timestamp !== undefined && timestamp > 0) {
        activityByWaveId.set(waveId, timestamp);
      }
    });

    return activityByWaveId;
  }, [activityTimestamps, uniqueWaveIds]);
}
