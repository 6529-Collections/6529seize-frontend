"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useWavesV2 } from "./useWavesV2";
import { useUnreadDmDrops } from "./useUnreadDmDrops";
import {
  SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";

const noopWaveAction = () => {};
const MAX_RECONCILIATION_ATTEMPTS_PER_VIEWER = 2;

interface UseDmWavesListOptions {
  readonly enabled?: boolean | undefined;
}

const useDmWavesList = (options: UseDmWavesListOptions = {}) => {
  const queryClient = useQueryClient();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const {
    activeProfileProxy,
    connectedProfile,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const authJwt = getAuthJwt();
  const connectedProfileId = connectedProfile?.id ?? null;
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile =
    hasValidWalletAuthorization &&
    (isAuthenticated ?? !!connectedProfile?.handle) &&
    !!connectedProfileId &&
    isAuthJwtUsable(authJwt);
  const isPendingAuthSwitch = Boolean(
    address && (!hasValidWalletAuthorization || fetchingProfile)
  );
  const isEnabled = options.enabled !== false;
  const viewerIdentityKey = useMemo(() => {
    if (!address || !hasValidWalletAuthorization || !hasAuthenticatedProfile) {
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    if (activeProfileProxy?.id) {
      return `${normalizedAddress}:profile:${connectedProfileId}:proxy:${activeProfileProxy.id}`;
    }

    return `${normalizedAddress}:profile:${connectedProfileId}:primary`;
  }, [
    address,
    activeProfileProxy?.id,
    connectedProfileId,
    hasAuthenticatedProfile,
    hasValidWalletAuthorization,
  ]);
  const shouldFetchDmWaves = Boolean(
    isEnabled &&
    address &&
    hasAuthenticatedProfile &&
    viewerIdentityKey &&
    !isPendingAuthSwitch
  );

  const {
    waves: mainWaves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status,
    refetch,
    queryKey: dmWavesQueryKey,
    dataUpdatedAt: dmWavesDataUpdatedAt,
  } = useWavesV2({
    overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    directMessage: true,
    viewerIdentityKey,
    enabled: shouldFetchDmWaves,
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
  const { unreadDmDropsCount } = useUnreadDmDrops(
    connectedProfile?.handle ?? null,
    { enabled: shouldFetchDmWaves }
  );
  const reconciliationStateRef = useRef<{
    readonly viewerIdentityKey: string;
    readonly attempts: number;
    readonly lastDataUpdatedAt: number;
  } | null>(null);
  const listedUnreadDropsCount = useMemo(
    () =>
      mainWaves.reduce(
        (total, wave) => total + Math.max(wave.unreadDropsCount, 0),
        0
      ),
    [mainWaves]
  );

  useEffect(() => {
    if (
      !shouldFetchDmWaves ||
      !viewerIdentityKey ||
      unreadDmDropsCount <= listedUnreadDropsCount
    ) {
      reconciliationStateRef.current = null;
      return;
    }

    if (isFetching) {
      return;
    }

    const previousState =
      reconciliationStateRef.current?.viewerIdentityKey === viewerIdentityKey
        ? reconciliationStateRef.current
        : {
            viewerIdentityKey,
            attempts: 0,
            lastDataUpdatedAt: -1,
          };
    const hasNewDmSnapshot =
      previousState.lastDataUpdatedAt !== dmWavesDataUpdatedAt;
    if (
      previousState.attempts >= MAX_RECONCILIATION_ATTEMPTS_PER_VIEWER ||
      (previousState.attempts > 0 && !hasNewDmSnapshot)
    ) {
      return;
    }

    reconciliationStateRef.current = {
      viewerIdentityKey,
      attempts: previousState.attempts + 1,
      lastDataUpdatedAt: dmWavesDataUpdatedAt,
    };
    // Retry only when a fresh DM snapshot is still behind, then let regular
    // polling continue without creating an unbounded reconciliation loop.
    void queryClient.refetchQueries({
      queryKey: dmWavesQueryKey,
      exact: true,
      type: "active",
    });
  }, [
    dmWavesQueryKey,
    dmWavesDataUpdatedAt,
    isFetching,
    listedUnreadDropsCount,
    queryClient,
    shouldFetchDmWaves,
    unreadDmDropsCount,
    viewerIdentityKey,
  ]);

  // sort by latest drop
  const sorted = useMemo(() => {
    if (!shouldFetchDmWaves) {
      return [];
    }

    return [...mainWaves].sort(
      (a, b) => (b.latestDropTimestamp ?? 0) - (a.latestDropTimestamp ?? 0)
    );
  }, [mainWaves, shouldFetchDmWaves]);

  const fetchNextPageStable = useCallback(() => {
    if (!shouldFetchDmWaves) {
      return;
    }

    fetchNextPage();
  }, [fetchNextPage, shouldFetchDmWaves]);

  const refetchStable = useCallback(() => {
    if (!shouldFetchDmWaves) {
      return;
    }

    refetch();
  }, [refetch, shouldFetchDmWaves]);

  return useMemo(
    () => ({
      waves: sorted,
      isFetching: shouldFetchDmWaves ? isFetching : false,
      isFetchingNextPage: shouldFetchDmWaves ? isFetchingNextPage : false,
      hasNextPage: shouldFetchDmWaves ? hasNextPage : false,
      fetchNextPage: fetchNextPageStable,
      status: shouldFetchDmWaves ? status : "pending",
      pinnedWaves: [],
      isPinnedWavesLoading: false,
      hasPinnedWavesError: false,
      addPinnedWave: noopWaveAction,
      removePinnedWave: noopWaveAction,
      loadSubwavesForParent: noopWaveAction,
      prefetchSubwavesForParent: noopWaveAction,
      mainWaves: shouldFetchDmWaves ? mainWaves : [],
      missingPinnedIds: [],
      mainWavesRefetch: refetchStable,
      refetchAllWaves: refetchStable,
      viewerIdentityKey,
    }),
    [
      sorted,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPageStable,
      status,
      mainWaves,
      refetchStable,
      shouldFetchDmWaves,
      viewerIdentityKey,
    ]
  );
};

export default useDmWavesList;
