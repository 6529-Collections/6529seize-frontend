"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useWavesV2 } from "./useWavesV2";
import {
  SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";

const noopWaveAction = () => {};

const useDmWavesList = () => {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy } = useAuth();
  const viewerIdentityKey = useMemo(() => {
    if (!address) {
      return null;
    }

    const normalizedAddress = address.toLowerCase();
    if (activeProfileProxy?.id) {
      return `${normalizedAddress}:proxy:${activeProfileProxy.id}`;
    }

    return `${normalizedAddress}:primary`;
  }, [address, activeProfileProxy?.id]);

  const {
    waves: mainWaves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status,
    refetch,
  } = useWavesV2({
    overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    directMessage: true,
    viewerIdentityKey,
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  // sort by latest drop
  const sorted = useMemo(() => {
    return [...mainWaves].sort(
      (a, b) => (b.latestDropTimestamp ?? 0) - (a.latestDropTimestamp ?? 0)
    );
  }, [mainWaves]);

  // minimal wrapper to match waves list return signature
  const addPinnedWave = noopWaveAction;
  const removePinnedWave = noopWaveAction;
  const loadSubwavesForParent = noopWaveAction;
  const prefetchSubwavesForParent = noopWaveAction;

  const fetchNextPageStable = useCallback(
    () => fetchNextPage(),
    [fetchNextPage]
  );

  return useMemo(
    () => ({
      waves: sorted,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage: fetchNextPageStable,
      status,
      pinnedWaves: [],
      isPinnedWavesLoading: false,
      hasPinnedWavesError: false,
      addPinnedWave,
      removePinnedWave,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
      mainWaves,
      missingPinnedIds: [],
      mainWavesRefetch: refetch,
      refetchAllWaves: refetch,
    }),
    [
      sorted,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPageStable,
      status,
      mainWaves,
      refetch,
    ]
  );
};

export default useDmWavesList;
