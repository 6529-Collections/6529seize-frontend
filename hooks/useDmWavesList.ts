"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useWavesV2 } from "./useWavesV2";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { useStableCallback, useStableList } from "./useStableIdentity";

const noopWaveAction = () => {};
const NO_WAVES: readonly never[] = [];
const NO_WAVE_IDS: readonly string[] = [];

interface UseDmWavesListOptions {
  readonly enabled?: boolean | undefined;
}

const useDmWavesList = (options: UseDmWavesListOptions = {}) => {
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const {
    activeProfileProxy,
    connectedProfile,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile =
    hasValidWalletAuthorization &&
    (isAuthenticated ?? !!connectedProfile?.handle);
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
      return `${normalizedAddress}:proxy:${activeProfileProxy.id}`;
    }

    return `${normalizedAddress}:primary`;
  }, [
    address,
    activeProfileProxy?.id,
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
    refetchIfStale,
  } = useWavesV2({
    overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
    pageSize: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    directMessage: true,
    viewerIdentityKey,
    enabled: shouldFetchDmWaves,
  });

  // sort by latest drop
  const sorted = useMemo(() => {
    if (!shouldFetchDmWaves) {
      return [];
    }

    return [...mainWaves].sort(
      (a, b) => (b.latestDropTimestamp ?? 0) - (a.latestDropTimestamp ?? 0)
    );
  }, [mainWaves, shouldFetchDmWaves]);

  // The query hook hands back new functions on every render; keep these
  // identities stable so a re-render alone never changes the stream context.
  const fetchNextPageStable = useStableCallback(() => {
    if (!shouldFetchDmWaves) {
      return;
    }

    fetchNextPage();
  });

  const refetchStable = useStableCallback(() => {
    if (!shouldFetchDmWaves) {
      return;
    }

    refetch();
  });

  const refreshStaleWaves = useStableCallback(() => {
    if (!shouldFetchDmWaves) {
      return;
    }

    refetchIfStale();
  });
  const stableSorted = useStableList(sorted);
  const stableMainWaves = useStableList(
    shouldFetchDmWaves ? mainWaves : NO_WAVES
  );

  return useMemo(
    () => ({
      viewerIdentityKey,
      waves: stableSorted,
      isFetching: shouldFetchDmWaves ? isFetching : false,
      isFetchingNextPage: shouldFetchDmWaves ? isFetchingNextPage : false,
      hasNextPage: shouldFetchDmWaves ? hasNextPage : false,
      fetchNextPage: fetchNextPageStable,
      status: shouldFetchDmWaves ? status : "pending",
      pinnedWaves: NO_WAVES,
      isPinnedWavesLoading: false,
      hasPinnedWavesError: false,
      addPinnedWave: noopWaveAction,
      removePinnedWave: noopWaveAction,
      loadSubwavesForParent: noopWaveAction,
      prefetchSubwavesForParent: noopWaveAction,
      mainWaves: stableMainWaves,
      missingPinnedIds: NO_WAVE_IDS,
      mainWavesRefetch: refetchStable,
      refetchAllWaves: refetchStable,
      refreshStaleWaves,
    }),
    [
      stableSorted,
      viewerIdentityKey,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPageStable,
      status,
      stableMainWaves,
      refetchStable,
      refreshStaleWaves,
      shouldFetchDmWaves,
    ]
  );
};

export default useDmWavesList;
