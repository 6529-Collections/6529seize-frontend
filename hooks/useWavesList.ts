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
  WAVE_SCORE_DISCOVERY_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import { usePinnedWavesServer } from "./usePinnedWavesServer";
import { useWaveById } from "./useWaveById";
import {
  getWaveSubwavesQueryOptions,
  useWaveSubwavesMap,
} from "./useWaveSubwaves";
import { useShowFollowingWaves } from "./useShowFollowingWaves";
import type { SidebarWave } from "@/types/waves.types";
import { useQueryClient } from "@tanstack/react-query";

// Enhanced wave interface with isPinned field and newDropsCount
type EnhancedWave = SidebarWave & {
  readonly isPinned: boolean;
  readonly isOfficial?: boolean;
  readonly sidebarSection?: SidebarDiscoverySection;
};

export type SidebarDiscoverySection = "highly-rated" | "all";

type SidebarWaveWithDiscoverySection = SidebarWave & {
  readonly sidebarSection?: SidebarDiscoverySection;
};

const HIGHLY_RATED_WAVE_LIMIT = 10;
const HIGHLY_RATED_QUERY_PAGE_SIZE = 10;

// V2 overview, pinned, and announcement wave sources are root-wave
// sources. This guard is defensive against stale or malformed cached data; it is
// not intended to hide user-visible subwaves.
const isExpectedRootSidebarWave = (wave: SidebarWave) =>
  wave.parentWaveId === null;

const getLatestKnownActivityTimestamp = (
  wave: Pick<
    SidebarWave,
    "latestDropTimestamp" | "latestFollowedSubwaveDropTimestamp"
  >
) =>
  Math.max(
    wave.latestDropTimestamp ?? 0,
    wave.latestFollowedSubwaveDropTimestamp ?? 0
  );

const getFirstUnreadSerialNo = (
  left: number | null,
  right: number | null
): number | null => {
  if (left === null) {
    return right;
  }

  if (right === null) {
    return left;
  }

  return Math.min(left, right);
};

const isKnownWaveForCurrentViewer = (wave: SidebarWave) =>
  wave.subscribed || wave.followedSubwavesCount > 0;

/**
 * Hook for managing and fetching waves list including pinned waves
 * @returns Wave list data and loading states
 */
const useWavesList = () => {
  const queryClient = useQueryClient();
  const { connectedProfile, activeProfileProxy } = useAuth();
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
    return !!connectedProfile?.handle && !activeProfileProxy;
  }, [connectedProfile?.handle, activeProfileProxy]);
  const viewerIdentityKey = useMemo(() => {
    if (!address) {
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    if (activeProfileProxy?.id != null) {
      return `${normalizedAddress}:proxy:${activeProfileProxy.id}`;
    }

    return `${normalizedAddress}:primary`;
  }, [address, activeProfileProxy?.id]);

  const nonPinnedFilter = isConnectedIdentity
    ? ApiWavesPinFilter.NotPinned
    : undefined;

  // Fetch the best quality-ranked waves that are neither pinned nor followed.
  const {
    waves: highlyRatedWaves,
    isFetching: isHighlyRatedWavesFetching,
    refetch: highlyRatedWavesRefetch,
  } = useWavesV2({
    overviewType: WAVE_SCORE_DISCOVERY_PARAMS.overviewType,
    pageSize: HIGHLY_RATED_QUERY_PAGE_SIZE,
    following: false,
    directMessage: false,
    excludeFollowed: isConnectedIdentity ? true : undefined,
    pinned: nonPinnedFilter,
    scoreSort: ApiWaveScoreSort.Quality,
    viewerIdentityKey,
    refetchInterval: following
      ? false
      : SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled: true,
  });
  // Fetch quality-ranked waves for the broad discovery section and pagination.
  const {
    waves: allQualityWaves,
    isFetching: isAllQualityWavesFetching,
    isFetchingNextPage: isAllQualityWavesFetchingNextPage,
    hasNextPage: hasAllQualityWavesNextPage,
    fetchNextPage: fetchNextAllQualityWavesPage,
    status: allQualityWavesStatus,
    refetch: allQualityWavesRefetch,
  } = useWavesV2({
    overviewType: WAVE_SCORE_DISCOVERY_PARAMS.overviewType,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    following: false,
    directMessage: false,
    excludeFollowed: isConnectedIdentity ? true : undefined,
    pinned: nonPinnedFilter,
    scoreSort: ApiWaveScoreSort.Quality,
    viewerIdentityKey,
    refetchInterval: following
      ? false
      : SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled: true,
  });
  // Fetch followed waves by latest post activity for the known-wave sidebar.
  const {
    waves: followedActivityWaves,
    isFetching: isFollowedActivityWavesFetching,
    isFetchingNextPage: isFollowedActivityWavesFetchingNextPage,
    hasNextPage: hasFollowedActivityWavesNextPage,
    fetchNextPage: fetchNextFollowedActivityWavesPage,
    status: followedActivityWavesStatus,
    refetch: followedActivityWavesRefetch,
  } = useWavesV2({
    overviewType: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    following: isConnectedIdentity,
    directMessage: false,
    viewerIdentityKey,
    refetchInterval: following
      ? SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS
      : false,
    refetchIntervalInBackground: false,
    enabled: isConnectedIdentity,
  });
  const mainWaves = useMemo<SidebarWaveWithDiscoverySection[]>(
    () => [
      ...followedActivityWaves,
      // Keep the highly-rated slice before the broader all-quality list:
      // duplicate wave ids retain their first sidebarSection during merge.
      ...highlyRatedWaves
        .filter((wave) => !isKnownWaveForCurrentViewer(wave))
        .slice(0, HIGHLY_RATED_WAVE_LIMIT)
        .map(
          (wave): SidebarWaveWithDiscoverySection => ({
            ...wave,
            sidebarSection: "highly-rated",
          })
        ),
      ...allQualityWaves.map(
        (wave): SidebarWaveWithDiscoverySection => ({
          ...wave,
          sidebarSection: "all",
        })
      ),
    ],
    [followedActivityWaves, highlyRatedWaves, allQualityWaves]
  );
  const isMainWavesFetching =
    isAllQualityWavesFetching ||
    isHighlyRatedWavesFetching ||
    isFollowedActivityWavesFetching;
  const isMainWavesFetchingNextPage =
    isAllQualityWavesFetchingNextPage ||
    (following && isFollowedActivityWavesFetchingNextPage);
  const hasMainWavesNextPage =
    hasAllQualityWavesNextPage ||
    (following && hasFollowedActivityWavesNextPage);
  const fetchNextMainWavesPage = useCallback(() => {
    if (!following) {
      return fetchNextAllQualityWavesPage();
    }

    const nextPageRequests = [];
    if (hasFollowedActivityWavesNextPage) {
      nextPageRequests.push(fetchNextFollowedActivityWavesPage());
    }
    if (hasAllQualityWavesNextPage) {
      nextPageRequests.push(fetchNextAllQualityWavesPage());
    }

    return Promise.all(nextPageRequests);
  }, [
    following,
    fetchNextAllQualityWavesPage,
    fetchNextFollowedActivityWavesPage,
    hasAllQualityWavesNextPage,
    hasFollowedActivityWavesNextPage,
  ]);
  const mainWavesStatus =
    following && followedActivityWavesStatus === "error"
      ? followedActivityWavesStatus
      : allQualityWavesStatus;
  const mainWavesRefetch = useCallback(() => {
    if (following) {
      void followedActivityWavesRefetch();
    }

    return allQualityWavesRefetch();
  }, [following, allQualityWavesRefetch, followedActivityWavesRefetch]);
  const trackedAnnouncementWave = useMemo(
    () =>
      mainWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      serverPinnedWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      null,
    [mainWaves, serverPinnedWaves, isAnnouncementsWave]
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
      if (!isAnnouncementsWave(wave.id)) {
        if (!isExpectedRootSidebarWave(wave)) {
          return;
        }
        map.set(wave.id, wave);
      }
    });
    return map;
  }, [mainWaves, isAnnouncementsWave]);

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
        !isAnnouncementsWave(wave.id)
    );
  }, [serverPinnedWaves, mainWaveIds, isAnnouncementsWave]);

  // Collect ALL pinned waves (both from mainWaves and server-provided)
  const allPinnedWaves = useMemo(() => {
    const result: EnhancedWave[] = [];

    // Add all server-provided pinned waves, filtering out DMs
    serverPinnedWaves.forEach((wave) => {
      if (
        !wave.isDirectMessage &&
        isExpectedRootSidebarWave(wave) &&
        !isAnnouncementsWave(wave.id)
      ) {
        result.push({ ...wave, isPinned: true });
      }
    });

    return result;
  }, [serverPinnedWaves, isAnnouncementsWave]);

  // New drops counts are now managed externally

  // Combine activity and discovery sources. Pinned/followed rows are
  // activity-first; non-followed rows preserve the score-ranked backend order.
  const combinedWaves = useMemo(() => {
    const allWavesMap = new Map<string, EnhancedWave>();
    const pinnedWavesSet = new Set(pinnedIds);
    const allWavesArray: EnhancedWave[] = [];

    [...mainWaves, ...separatelyFetchedPinnedWaves].forEach((wave) => {
      if (
        wave.isDirectMessage ||
        !isExpectedRootSidebarWave(wave) ||
        isAnnouncementsWave(wave.id)
      ) {
        return;
      }

      const existingWave = allWavesMap.get(wave.id);
      const sidebarSection: SidebarDiscoverySection | undefined = (
        wave as SidebarWaveWithDiscoverySection
      ).sidebarSection;

      const nextLatestFollowedSubwaveDropTimestamp = Math.max(
        existingWave?.latestFollowedSubwaveDropTimestamp ?? 0,
        wave.latestFollowedSubwaveDropTimestamp ?? 0
      );
      const preservedSidebarSection =
        existingWave?.sidebarSection ?? sidebarSection ?? "all";
      const isPinned = pinnedWavesSet.has(wave.id);

      // The current source has the freshest wave payload; the fields below
      // intentionally preserve cross-source sidebar state that can appear only
      // on an earlier duplicate row for the same wave id.
      allWavesMap.set(wave.id, {
        ...(existingWave ?? wave),
        ...wave,
        subscribed: existingWave?.subscribed || wave.subscribed,
        followedSubwavesCount: Math.max(
          existingWave?.followedSubwavesCount ?? 0,
          wave.followedSubwavesCount
        ),
        latestFollowedSubwaveDropTimestamp:
          nextLatestFollowedSubwaveDropTimestamp > 0
            ? nextLatestFollowedSubwaveDropTimestamp
            : null,
        unreadFollowedSubwaveDrops: Math.max(
          existingWave?.unreadFollowedSubwaveDrops ?? 0,
          wave.unreadFollowedSubwaveDrops
        ),
        firstUnreadFollowedSubwaveDropSerialNo: getFirstUnreadSerialNo(
          existingWave?.firstUnreadFollowedSubwaveDropSerialNo ?? null,
          wave.firstUnreadFollowedSubwaveDropSerialNo
        ),
        isPinned,
        sidebarSection: preservedSidebarSection,
      });
    });

    const nonAnnouncementWaves = [...allWavesMap.values()];
    const sortedPinnedWaves = nonAnnouncementWaves
      .filter((wave) => wave.isPinned)
      .sort(
        (a, b) =>
          getLatestKnownActivityTimestamp(b) -
          getLatestKnownActivityTimestamp(a)
      );
    const activityOrderedFollowingWaves = nonAnnouncementWaves
      .filter((wave) => !wave.isPinned && isKnownWaveForCurrentViewer(wave))
      .sort(
        (a, b) =>
          getLatestKnownActivityTimestamp(b) -
          getLatestKnownActivityTimestamp(a)
      );
    const highlyRatedDiscoveryWaves = nonAnnouncementWaves.filter(
      (wave) =>
        !wave.isPinned &&
        !isKnownWaveForCurrentViewer(wave) &&
        wave.sidebarSection === "highly-rated"
    );
    const backendOrderedScoreWaves = nonAnnouncementWaves.filter(
      (wave) =>
        !wave.isPinned &&
        !isKnownWaveForCurrentViewer(wave) &&
        wave.sidebarSection !== "highly-rated"
    );
    const sortedNonAnnouncementWaves = [
      ...highlyRatedDiscoveryWaves,
      ...sortedPinnedWaves,
      ...activityOrderedFollowingWaves,
      ...backendOrderedScoreWaves,
    ];

    if (announcementWave) {
      allWavesArray.push({
        ...announcementWave,
        isPinned: pinnedWavesSet.has(announcementWave.id),
      });
    }

    allWavesArray.push(...sortedNonAnnouncementWaves);

    return allWavesArray;
  }, [
    mainWaves,
    separatelyFetchedPinnedWaves,
    pinnedIds,
    announcementWave,
    isAnnouncementsWave,
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
    subwavesByParentId,
    refetch: refetchSubwaves,
  } = useWaveSubwavesMap({
    parentWaveIds: loadedSubwaveParentIds,
    viewerIdentityKey,
  });
  const loadingSubwaveParentIds = useMemo(
    () =>
      loadedSubwaveParentIds.filter(
        (parentWaveId) =>
          subwavesByParentId.get(parentWaveId)?.isFetching === true
      ),
    [loadedSubwaveParentIds, subwavesByParentId]
  );

  // Function to refetch all waves (main, pinned, announcements, subwaves)
  const refetchAllWaves = useCallback(() => {
    allQualityWavesRefetch();
    highlyRatedWavesRefetch();
    followedActivityWavesRefetch();
    void refetchPinnedWaves();
    refetchSubwaves();
    if (shouldFetchAnnouncementWave) {
      void announcementRefetch();
    }
  }, [
    allQualityWavesRefetch,
    highlyRatedWavesRefetch,
    followedActivityWavesRefetch,
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
    return fetchNextMainWavesPage();
  }, [fetchNextMainWavesPage]);

  // Memoize the entire return object to prevent unnecessary re-renders in consumer components
  // Components using this hook will only re-render when the values they use actually change
  return useMemo(
    () => ({
      // Main data - derived from combined waves, with enhanced type
      waves: allWaves,

      // Original waves pagination and loading
      isFetching: isMainWavesFetching,
      isFetchingNextPage: isMainWavesFetchingNextPage,
      hasNextPage: hasMainWavesNextPage,
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
      loadingSubwaveParentIds,
    }),
    [
      allWaves,
      isMainWavesFetching,
      isMainWavesFetchingNextPage,
      hasMainWavesNextPage,
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
      loadingSubwaveParentIds,
    ]
  );
};

export default useWavesList;
