"use client";

import { useMemo, useCallback, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { normalizeOptionalWaveId } from "@/helpers/waves/wave.helpers";
import { mapApiWaveToSidebarWave, useWavesV2 } from "./useWavesV2";
import {
  SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { usePinnedWavesServer } from "./usePinnedWavesServer";
import { useWaveById } from "./useWaveById";
import {
  getWaveSubwavesQueryOptions,
  useWaveSubwavesMap,
} from "./useWaveSubwaves";
import { useShowFollowingWaves } from "./useShowFollowingWaves";
import { useOfficialWaves } from "./useOfficialWaves";
import type { SidebarWave } from "@/types/waves.types";
import { useQueryClient } from "@tanstack/react-query";

// Enhanced wave interface with isPinned field and newDropsCount
type EnhancedWave = SidebarWave & {
  readonly isPinned: boolean;
  readonly isOfficial?: boolean;
};

// V2 overview, pinned, official, and announcement wave sources are root-wave
// sources. This guard is defensive against stale or malformed cached data; it is
// not intended to hide user-visible subwaves.
const isExpectedRootSidebarWave = (wave: SidebarWave) =>
  wave.parentWaveId === null;

/**
 * Hook for managing and fetching waves list including pinned waves
 * @returns Wave list data and loading states
 */
const useWavesList = () => {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy, isAuthenticated } = useAuth();
  const { address } = useSeizeConnectContext();
  const { seizeSettings, isAnnouncementsWave } = useSeizeSettings();
  const {
    pinnedIds,
    pinnedWaves: serverPinnedWaves,
    pinWave,
    unpinWave,
    isLoading: isPinnedWavesLoadingServer,
    isError: hasPinnedWavesErrorServer,
    refetch: refetchPinnedWaves,
  } = usePinnedWavesServer();
  const [following] = useShowFollowingWaves();
  const announcementsWaveId = normalizeOptionalWaveId(
    seizeSettings.announcements_wave_id
  );

  // Track connected identity state - memoize to prevent re-renders
  const isConnectedIdentity = useMemo(() => {
    return (
      !!connectedProfile?.handle &&
      !activeProfileProxy &&
      (isAuthenticated ?? true)
    );
  }, [connectedProfile?.handle, activeProfileProxy, isAuthenticated]);
  const isPendingAuthSwitch = Boolean(address && isAuthenticated === false);
  const viewerIdentityKey = useMemo(() => {
    if (!address || isAuthenticated === false) {
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    if (activeProfileProxy?.id != null) {
      return `${normalizedAddress}:proxy:${activeProfileProxy.id}`;
    }

    return `${normalizedAddress}:primary`;
  }, [address, activeProfileProxy?.id, isAuthenticated]);

  // Fetch main waves list
  const {
    waves: mainWaves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status: mainWavesStatus,
    refetch: mainWavesRefetch,
  } = useWavesV2({
    overviewType: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    following: isConnectedIdentity && following,
    directMessage: false,
    viewerIdentityKey,
    enabled: !isPendingAuthSwitch,
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
  const {
    waves: officialWaves,
    isFetching: isOfficialWavesFetching,
    refetch: officialWavesRefetch,
  } = useOfficialWaves({
    viewerIdentityKey,
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
  const officialWaveIds = useMemo(
    () => new Set(officialWaves.map((wave) => wave.id)),
    [officialWaves]
  );
  const visibleOfficialWaves = useMemo(
    () =>
      officialWaves.filter(
        (wave) =>
          !wave.isDirectMessage &&
          isExpectedRootSidebarWave(wave) &&
          !isAnnouncementsWave(wave.id)
      ),
    [officialWaves, isAnnouncementsWave]
  );

  const trackedAnnouncementWave = useMemo(
    () =>
      mainWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      officialWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      serverPinnedWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      null,
    [mainWaves, officialWaves, serverPinnedWaves, isAnnouncementsWave]
  );
  const shouldFetchAnnouncementWave = Boolean(
    announcementsWaveId && !trackedAnnouncementWave
  );
  const {
    wave: fetchedAnnouncementWave,
    isLoading: rawAnnouncementQueryLoading,
    error: rawAnnouncementQueryError,
    refetch: announcementRefetch,
  } = useWaveById(announcementsWaveId, {
    enabled: shouldFetchAnnouncementWave,
  });
  const announcementQueryLoading =
    shouldFetchAnnouncementWave && rawAnnouncementQueryLoading;
  const announcementQueryError = shouldFetchAnnouncementWave
    ? rawAnnouncementQueryError
    : null;
  const fetchedAnnouncementSidebarWave = useMemo(
    () =>
      fetchedAnnouncementWave
        ? mapApiWaveToSidebarWave(fetchedAnnouncementWave)
        : null,
    [fetchedAnnouncementWave]
  );
  const announcementWave = useMemo(() => {
    const resolvedWave =
      trackedAnnouncementWave ?? fetchedAnnouncementSidebarWave;
    if (
      !resolvedWave ||
      resolvedWave.isDirectMessage ||
      !isExpectedRootSidebarWave(resolvedWave)
    ) {
      return null;
    }
    return resolvedWave;
  }, [trackedAnnouncementWave, fetchedAnnouncementSidebarWave]);

  // Create a map of mainWaves by ID for easy lookup
  const mainWavesMap = useMemo(() => {
    const map = new Map<string, SidebarWave>();
    mainWaves.forEach((wave) => {
      if (!isAnnouncementsWave(wave.id) && !officialWaveIds.has(wave.id)) {
        if (!isExpectedRootSidebarWave(wave)) {
          return;
        }
        map.set(wave.id, wave);
      }
    });
    return map;
  }, [mainWaves, isAnnouncementsWave, officialWaveIds]);

  // Set of wave IDs in the main list for quick checking
  const mainWaveIds = useMemo(() => {
    return new Set(mainWavesMap.keys());
  }, [mainWavesMap]);

  // Server provides full pinned waves data, so no individual fetching needed
  const missingPinnedIds = useMemo<string[]>(() => [], []);

  // Use server-provided pinned waves
  const separatelyFetchedPinnedWaves = useMemo(() => {
    // Filter out pinned waves that are already in mainWaves to avoid duplicates
    return serverPinnedWaves.filter(
      (wave) =>
        !mainWaveIds.has(wave.id) &&
        isExpectedRootSidebarWave(wave) &&
        !isAnnouncementsWave(wave.id) &&
        !officialWaveIds.has(wave.id)
    );
  }, [serverPinnedWaves, mainWaveIds, isAnnouncementsWave, officialWaveIds]);

  // Collect ALL pinned waves (both from mainWaves and server-provided)
  const allPinnedWaves = useMemo(() => {
    const result: EnhancedWave[] = [];

    // Add all server-provided pinned waves, filtering out DMs
    serverPinnedWaves.forEach((wave) => {
      if (
        !wave.isDirectMessage &&
        isExpectedRootSidebarWave(wave) &&
        !isAnnouncementsWave(wave.id) &&
        !officialWaveIds.has(wave.id)
      ) {
        result.push({ ...wave, isPinned: true });
      }
    });

    return result;
  }, [serverPinnedWaves, isAnnouncementsWave, officialWaveIds]);

  // New drops counts are now managed externally

  // Combine main waves with separately fetched pinned waves using useMemo
  // Simplified order: All waves sorted by latest_drop_timestamp (most recent first)
  const combinedWaves = useMemo(() => {
    const allWavesMap = new Map<string, EnhancedWave>();
    const pinnedWavesSet = new Set(pinnedIds);
    const allWavesArray: EnhancedWave[] = [];

    [...mainWaves, ...separatelyFetchedPinnedWaves].forEach((wave) => {
      if (
        wave.isDirectMessage ||
        !isExpectedRootSidebarWave(wave) ||
        isAnnouncementsWave(wave.id) ||
        officialWaveIds.has(wave.id)
      ) {
        return;
      }

      allWavesMap.set(wave.id, {
        ...wave,
        isPinned: pinnedWavesSet.has(wave.id),
      });
    });

    const sortedOfficialWaves = visibleOfficialWaves
      .map((wave) => ({
        ...wave,
        isPinned: pinnedWavesSet.has(wave.id),
        isOfficial: true,
      }))
      .sort(
        (a, b) => (b.latestDropTimestamp ?? 0) - (a.latestDropTimestamp ?? 0)
      );

    const sortedNonAnnouncementWaves = [...allWavesMap.values()].sort(
      (a, b) => (b.latestDropTimestamp ?? 0) - (a.latestDropTimestamp ?? 0)
    );

    if (announcementWave) {
      allWavesArray.push({
        ...announcementWave,
        isPinned: pinnedWavesSet.has(announcementWave.id),
      });
    }

    allWavesArray.push(...sortedOfficialWaves);
    allWavesArray.push(...sortedNonAnnouncementWaves);

    return allWavesArray;
  }, [
    mainWaves,
    separatelyFetchedPinnedWaves,
    visibleOfficialWaves,
    pinnedIds,
    announcementWave,
    isAnnouncementsWave,
    officialWaveIds,
  ]);

  const [loadedSubwaveParentIds, setLoadedSubwaveParentIds] = useState<
    readonly string[]
  >([]);

  const rootWaveIds = useMemo(
    () => new Set(combinedWaves.map((wave) => wave.id)),
    [combinedWaves]
  );

  const loadSubwavesForParent = useCallback(
    (parentWaveId: string) => {
      if (!rootWaveIds.has(parentWaveId)) {
        return;
      }

      setLoadedSubwaveParentIds((previousParentIds) => {
        if (previousParentIds.includes(parentWaveId)) {
          return previousParentIds;
        }

        return [...previousParentIds, parentWaveId];
      });
    },
    [rootWaveIds]
  );

  const prefetchSubwavesForParent = useCallback(
    (parentWaveId: string) => {
      if (!rootWaveIds.has(parentWaveId)) {
        return;
      }

      queryClient
        .prefetchQuery(
          getWaveSubwavesQueryOptions(parentWaveId, viewerIdentityKey)
        )
        .catch(() => undefined);
    },
    [queryClient, rootWaveIds, viewerIdentityKey]
  );

  const {
    subwaves,
    refetch: refetchSubwaves,
  } = useWaveSubwavesMap({
    parentWaveIds: loadedSubwaveParentIds,
    viewerIdentityKey,
  });

  // Function to refetch all waves (main, pinned, official, announcements, subwaves)
  const refetchAllWaves = useCallback(() => {
    mainWavesRefetch();
    officialWavesRefetch();
    void refetchPinnedWaves();
    refetchSubwaves();
    if (shouldFetchAnnouncementWave) {
      void announcementRefetch();
    }
  }, [
    mainWavesRefetch,
    officialWavesRefetch,
    refetchPinnedWaves,
    refetchSubwaves,
    announcementRefetch,
    shouldFetchAnnouncementWave,
  ]);

  // Derived data should come directly from memoized inputs
  const allWaves = useMemo(
    () => [...combinedWaves, ...subwaves],
    [combinedWaves, subwaves]
  );

  // New drops counting logic has been removed and will be managed by context

  // Use server-side loading and error states
  const isPinnedWavesLoading = isPinnedWavesLoadingServer;
  const hasPinnedWavesError = hasPinnedWavesErrorServer;

  // Memoize the fetchNextPage function to ensure it doesn't change on every render
  const fetchNextPageStable = useCallback(() => {
    return fetchNextPage();
  }, [fetchNextPage]);

  // Memoize the entire return object to prevent unnecessary re-renders in consumer components
  // Components using this hook will only re-render when the values they use actually change
  return useMemo(
    () => ({
      // Main data - derived from combined waves, with enhanced type
      waves: allWaves,

      // Original waves pagination and loading
      isFetching: isFetching || isOfficialWavesFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage: fetchNextPageStable,
      status: mainWavesStatus,

      // Pinned waves metadata - now includes ALL pinned waves with isPinned flag
      pinnedWaves: allPinnedWaves,
      isPinnedWavesLoading,
      hasPinnedWavesError,
      trackedAnnouncementWave,
      announcementWave,
      announcementQueryLoading,
      announcementQueryError,
      announcementRefetch,

      // Pinned waves management functions
      addPinnedWave: pinWave,
      removePinnedWave: unpinWave,

      // Additional data that might be useful
      mainWaves,
      missingPinnedIds,
      mainWavesRefetch,
      // Refetch all waves including main and pinned
      refetchAllWaves,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
    }),
    [
      allWaves,
      isFetching,
      isOfficialWavesFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPageStable,
      mainWavesStatus,
      mainWaves,
      allPinnedWaves,
      isPinnedWavesLoading,
      hasPinnedWavesError,
      trackedAnnouncementWave,
      announcementWave,
      announcementQueryLoading,
      announcementQueryError,
      announcementRefetch,
      pinWave,
      unpinWave,
      missingPinnedIds,
      mainWavesRefetch,
      refetchAllWaves,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
    ]
  );
};

export default useWavesList;
