"use client";

import { runWaveNavigationTransition } from "@/helpers/waves/wave-navigation-transition";
import {
  getCompetitionRoute,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import { waveCompetitionTabs } from "@/helpers/default-competition.helpers";
import { useWaveTabPreference } from "@/hooks/useWaveTabPreference";
import { useQueryClient } from "@tanstack/react-query";
import { defaultCompetitionQueryKey } from "@/services/api/competitions-api";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import type { ApiDefaultCompetition } from "@/generated/models/ApiDefaultCompetition";
import {
  getActiveWaveIdFromUrl,
  getWaveHomeRoute,
  getWaveRoute,
  isEncryptedMessagesPathname,
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
    // Competition pages have route-bound content that a history update cannot replace.
    isOnWaves:
      !isCompetitionPathname(pathname) &&
      (pathname === "/waves" || pathname.startsWith("/waves/")),
    // Encrypted chats are separate routes: leaving them for a plaintext DM
    // needs a router navigation, not a history-only wave switch.
    isOnMessages:
      (pathname === "/messages" || pathname.startsWith("/messages/")) &&
      !isEncryptedMessagesPathname(pathname),
  };
};

export function useActiveWaveManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isApp } = useDeviceInfo();
  const { tabsRef } = useWaveTabPreference();
  const queryClient = useQueryClient();
  const viewer = useCompetitionViewer();

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
      const remembered = waveId ? tabsRef.current[waveId] : undefined;
      if (
        waveId &&
        !isDirectMessage &&
        serialNo === undefined &&
        typeof remembered === "object"
      ) {
        const selection = queryClient.getQueryData<ApiDefaultCompetition>(
          defaultCompetitionQueryKey(waveId, viewer)
        );
        const tab = waveCompetitionTabs[remembered.tab];
        if (tab && selection?.competition_id === remembered.competitionId) {
          const params = new URLSearchParams({ tab, restore: "1" });
          if (divider !== null && divider !== undefined)
            params.set("divider", String(divider));
          return `${getCompetitionRoute(waveId, remembered.competitionId)}?${params}`;
        }
      }
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
    [isApp, tabsRef, queryClient, viewer]
  );

  const canUsePushState = useCallback(
    (targetUrl: string, options?: WaveNavigationOptions) => {
      const { isOnWaves, isOnMessages } = getRouteContext();
      const isDirectMessage = options?.isDirectMessage ?? false;
      const targetPathname = new URL(targetUrl, globalThis.location.href)
        .pathname;
      return (
        (!isDirectMessage &&
          isOnWaves &&
          !isCompetitionPathname(targetPathname)) ||
        (isDirectMessage && isOnMessages)
      );
    },
    []
  );

  const { state: activeWaveId, navigate } = useClientNavigation<
    string | null,
    WaveNavigationOptions
  >({
    initialState: waveFromLocation,
    buildUrl,
    parseUrl: getWaveFromWindow,
    canUsePushState,
    deferRouteState: true,
  });

  const setActiveWave = useCallback<typeof navigate>(
    (waveId, options) => {
      const navigateToWave = () => navigate(waveId, options);
      if (
        isApp &&
        !options?.isDirectMessage &&
        canUsePushState(buildUrl(waveId, options), options)
      ) {
        runWaveNavigationTransition(waveId ? "wave" : "list", navigateToWave);
      } else {
        navigateToWave();
      }
    },
    [navigate, isApp, canUsePushState, buildUrl]
  );

  return {
    activeWaveId,
    hasActiveWaveDropTarget,
    setActiveWave,
  };
}
