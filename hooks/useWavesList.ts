"use client";

/* eslint max-lines-per-function: "off" */

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
import { usePinnedWavesServer } from "./usePinnedWavesServer";
import { useWaveById } from "./useWaveById";
import {
  getWaveSubwavesQueryOptions,
  useWaveSubwavesMap,
} from "./useWaveSubwaves";
import { useShowFollowingWaves } from "./useShowFollowingWaves";
import type { SidebarWave } from "@/types/waves.types";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildMainWaves,
  getConnectedIdentity,
  getHasAuthenticatedProfile,
  getMainWavesFetching,
  getModeValue,
  getNonPinnedFilter,
  getShouldLoadMainWaves,
  getViewerIdentityKey,
  isKnownWaveForCurrentViewer,
  SIDEBAR_DISCOVERY_SECTION_HIGHLY_RATED,
  type SidebarDiscoverySection,
  type SidebarWaveWithDiscoverySection,
} from "./useWavesList.helpers";

export type { SidebarDiscoverySection } from "./useWavesList.helpers";

// Enhanced wave interface with isPinned field and newDropsCount
type EnhancedWave = SidebarWave & {
  readonly isPinned: boolean;
  readonly isOfficial?: boolean;
  readonly sidebarSection?: SidebarDiscoverySection;
};

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

const noopWaveAction = (_waveId: string) => {};
const noopListAction = () => {};

/**
 * Hook for managing and fetching waves list including pinned waves
 * @returns Wave list data and loading states
 */
interface UseWavesListOptions {
  readonly enabled?: boolean | undefined;
}

const useWavesList = (options: UseWavesListOptions = {}) => {
  const queryClient = useQueryClient();
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const { seizeSettings, isAnnouncementsWave } = useSeizeSettings();
  const isEnabled = options.enabled !== false;
  const {
    pinnedIds,
    pinnedWaves: serverPinnedWaves,
    pinWave,
    unpinWave,
    isLoading: isPinnedWavesLoadingServer,
    isError: hasPinnedWavesErrorServer,
    refetch: refetchPinnedWaves,
  } = usePinnedWavesServer({ enabled: isEnabled });
  const [following] = useShowFollowingWaves();
  const announcementsWaveId = normalizeOptionalWaveId(
    seizeSettings.announcements_wave_id
  );
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasConnectedProfile = Boolean(connectedProfile?.handle);
  const hasAuthenticatedProfile = getHasAuthenticatedProfile({
    hasValidWalletAuthorization,
    isAuthenticated,
    hasConnectedProfile,
  });

  const isConnectedIdentity = getConnectedIdentity({
    hasConnectedProfile,
    hasActiveProfileProxy: Boolean(activeProfileProxy),
    hasAuthenticatedProfile,
  });
  const isJoinedMode = following && isConnectedIdentity;
  const shouldLoadMainWaves = getShouldLoadMainWaves({
    isEnabled,
    address,
    hasValidWalletAuthorization,
    fetchingProfile,
  });
  const viewerIdentityKey = getViewerIdentityKey({
    address,
    proxyId: activeProfileProxy?.id,
    hasAuthenticatedProfile,
    hasValidWalletAuthorization,
  });

  const nonPinnedFilter = getNonPinnedFilter(isConnectedIdentity);

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
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled: shouldLoadMainWaves,
  });
  // Fetch recent activity for the broad bottom section and pagination.
  const {
    waves: allActivityWaves,
    isFetching: isAllActivityWavesFetching,
    isFetchingNextPage: isAllActivityWavesFetchingNextPage,
    hasNextPage: hasAllActivityWavesNextPage,
    fetchNextPage: fetchNextAllActivityWavesPage,
    status: allActivityWavesStatus,
    refetch: allActivityWavesRefetch,
  } = useWavesV2({
    overviewType: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    following: false,
    directMessage: false,
    pinned: nonPinnedFilter,
    viewerIdentityKey,
    refetchInterval: isJoinedMode
      ? false
      : SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled: shouldLoadMainWaves && !isJoinedMode,
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
    refetchInterval: isJoinedMode
      ? SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS
      : false,
    refetchIntervalInBackground: false,
    enabled: shouldLoadMainWaves && isJoinedMode,
  });
  const mainWaves = useMemo<SidebarWaveWithDiscoverySection[]>(() => {
    // Keep the highly-rated slice before the broader activity list:
    // duplicate wave ids retain their first sidebarSection during merge.
    return buildMainWaves({
      shouldLoadMainWaves,
      isJoinedMode,
      highlyRatedWaves,
      followedActivityWaves,
      allActivityWaves,
    });
  }, [
    allActivityWaves,
    followedActivityWaves,
    highlyRatedWaves,
    isJoinedMode,
    shouldLoadMainWaves,
  ]);
  const isMainWavesFetching = getMainWavesFetching({
    shouldLoadMainWaves,
    isJoinedMode,
    isAllActivityWavesFetching,
    isHighlyRatedWavesFetching,
    isFollowedActivityWavesFetching,
  });
  const isMainWavesFetchingNextPage = getModeValue({
    shouldLoadMainWaves,
    isJoinedMode,
    joinedValue: isFollowedActivityWavesFetchingNextPage,
    allValue: isAllActivityWavesFetchingNextPage,
    deferredValue: false,
  });
  const hasMainWavesNextPage = getModeValue({
    shouldLoadMainWaves,
    isJoinedMode,
    joinedValue: hasFollowedActivityWavesNextPage,
    allValue: hasAllActivityWavesNextPage,
    deferredValue: false,
  });
  const fetchNextMainWavesPage = useCallback(() => {
    if (!shouldLoadMainWaves) {
      return;
    }

    if (isJoinedMode) {
      fetchNextFollowedActivityWavesPage();
      return;
    }

    fetchNextAllActivityWavesPage();
  }, [
    isJoinedMode,
    shouldLoadMainWaves,
    fetchNextAllActivityWavesPage,
    fetchNextFollowedActivityWavesPage,
  ]);
  const mainWavesStatus = getModeValue({
    shouldLoadMainWaves,
    isJoinedMode,
    joinedValue: followedActivityWavesStatus,
    allValue: allActivityWavesStatus,
    deferredValue: "pending",
  });
  const mainWavesRefetch = useCallback(() => {
    if (!shouldLoadMainWaves) {
      return;
    }

    if (isJoinedMode) {
      followedActivityWavesRefetch();
      return;
    }

    allActivityWavesRefetch();
  }, [
    isJoinedMode,
    shouldLoadMainWaves,
    allActivityWavesRefetch,
    followedActivityWavesRefetch,
  ]);
  const trackedAnnouncementWave = useMemo(() => {
    if (!shouldLoadMainWaves) {
      return null;
    }

    return (
      mainWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      serverPinnedWaves.find((wave) => isAnnouncementsWave(wave.id)) ??
      null
    );
  }, [mainWaves, serverPinnedWaves, isAnnouncementsWave, shouldLoadMainWaves]);
  const shouldFetchAnnouncementWave = Boolean(
    announcementsWaveId && !trackedAnnouncementWave && shouldLoadMainWaves
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
    if (!shouldLoadMainWaves) {
      return [];
    }

    // Filter out pinned waves that are already in mainWaves to avoid duplicates
    return serverPinnedWaves.filter(
      (wave) =>
        !mainWaveIds.has(wave.id) &&
        isExpectedRootSidebarWave(wave) &&
        !isAnnouncementsWave(wave.id)
    );
  }, [
    serverPinnedWaves,
    mainWaveIds,
    isAnnouncementsWave,
    shouldLoadMainWaves,
  ]);

  // Collect ALL pinned waves (both from mainWaves and server-provided)
  const allPinnedWaves = useMemo(() => {
    if (!shouldLoadMainWaves) {
      return [];
    }

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
  }, [shouldLoadMainWaves, serverPinnedWaves, isAnnouncementsWave]);

  // New drops counts are now managed externally

  // Combine activity and discovery sources. Top sections are grouped later;
  // regular bottom-list rows share one latest-activity order.
  const combinedWaves = useMemo(() => {
    if (!shouldLoadMainWaves) {
      return [];
    }

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
        subscribed: existingWave?.subscribed === true || wave.subscribed,
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
    // Product rule: All is one recent-activity stream. Joined uses the same
    // activity order, filtered by the followed-only query.
    const activityOrderedRegularWaves = nonAnnouncementWaves
      .filter(
        (wave) =>
          !wave.isPinned &&
          wave.sidebarSection !== SIDEBAR_DISCOVERY_SECTION_HIGHLY_RATED
      )
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
    const sortedNonAnnouncementWaves = [
      ...highlyRatedDiscoveryWaves,
      ...sortedPinnedWaves,
      ...activityOrderedRegularWaves,
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
    shouldLoadMainWaves,
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
      if (!shouldLoadMainWaves) {
        return;
      }

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
    [rootWaveIds, shouldLoadMainWaves]
  );

  const prefetchSubwavesForParent = useCallback(
    (parentWaveId: string) => {
      if (!shouldLoadMainWaves) {
        return;
      }

      if (!rootWaveIds.has(parentWaveId)) {
        return;
      }

      queryClient
        .prefetchQuery(
          getWaveSubwavesQueryOptions(parentWaveId, viewerIdentityKey)
        )
        .catch(() => undefined);
    },
    [queryClient, rootWaveIds, shouldLoadMainWaves, viewerIdentityKey]
  );

  const {
    subwaves,
    subwavesByParentId,
    refetch: refetchSubwaves,
  } = useWaveSubwavesMap({
    parentWaveIds: shouldLoadMainWaves ? loadedSubwaveParentIds : [],
    viewerIdentityKey: shouldLoadMainWaves ? viewerIdentityKey : null,
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
    if (!shouldLoadMainWaves) {
      return;
    }

    if (isJoinedMode) {
      followedActivityWavesRefetch();
    } else {
      allActivityWavesRefetch();
    }
    highlyRatedWavesRefetch();
    void refetchPinnedWaves();
    refetchSubwaves();
    if (shouldFetchAnnouncementWave) {
      void announcementRefetch();
    }
  }, [
    allActivityWavesRefetch,
    highlyRatedWavesRefetch,
    followedActivityWavesRefetch,
    isJoinedMode,
    refetchPinnedWaves,
    refetchSubwaves,
    announcementRefetch,
    shouldFetchAnnouncementWave,
    shouldLoadMainWaves,
  ]);

  const topSectionWaveIds = useMemo(() => {
    const ids = new Set<string>();

    combinedWaves.forEach((wave) => {
      if (
        isAnnouncementsWave(wave.id) ||
        wave.isPinned ||
        wave.sidebarSection === SIDEBAR_DISCOVERY_SECTION_HIGHLY_RATED
      ) {
        ids.add(wave.id);
      }
    });

    return ids;
  }, [combinedWaves, isAnnouncementsWave]);

  // Derived data should come directly from memoized inputs.
  const allWaves = useMemo(
    () =>
      shouldLoadMainWaves
        ? [
            ...combinedWaves,
            ...subwaves.filter(
              (wave) =>
                !isJoinedMode ||
                wave.subscribed ||
                topSectionWaveIds.has(wave.parentWaveId ?? "")
            ),
          ]
        : [],
    [
      combinedWaves,
      isJoinedMode,
      shouldLoadMainWaves,
      subwaves,
      topSectionWaveIds,
    ]
  );

  // New drops counting logic has been removed and will be managed by context

  // Use server-side loading and error states
  const isPinnedWavesLoading = shouldLoadMainWaves
    ? isPinnedWavesLoadingServer
    : false;
  const hasPinnedWavesError = shouldLoadMainWaves
    ? hasPinnedWavesErrorServer
    : false;

  // Memoize the fetchNextPage function to ensure it doesn't change on every render
  const fetchNextPageStable = useCallback(() => {
    fetchNextMainWavesPage();
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
      addPinnedWave: shouldLoadMainWaves ? pinWave : noopWaveAction,
      removePinnedWave: shouldLoadMainWaves ? unpinWave : noopWaveAction,

      // Additional data that might be useful
      mainWaves,
      missingPinnedIds,
      mainWavesRefetch: shouldLoadMainWaves ? mainWavesRefetch : noopListAction,
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
      shouldLoadMainWaves,
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
