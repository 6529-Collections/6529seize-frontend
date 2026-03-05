"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useWavesOverview } from "./useWavesOverview";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";

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
  } = useWavesOverview({
    type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    directMessage: true,
    viewerIdentityKey,
  });

  // sort by latest drop
  const sorted = useMemo(() => {
    return [...mainWaves].sort(
      (a, b) =>
        b.metrics.latest_drop_timestamp - a.metrics.latest_drop_timestamp
    );
  }, [mainWaves]);

  // minimal wrapper to match waves list return signature
  const addPinnedWave = () => {};
  const removePinnedWave = () => {};

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
