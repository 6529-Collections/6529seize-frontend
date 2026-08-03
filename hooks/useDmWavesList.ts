"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const RECONCILIATION_REARM_MIN_INTERVAL_MS =
  SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS * 5;

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
  const {
    unreadDmDropsCount,
    dataUpdatedAt: unreadDmDropsDataUpdatedAt,
    isFetching: isUnreadDmDropsFetching,
    refetch: refetchUnreadDmDrops,
  } = useUnreadDmDrops(connectedProfile?.handle ?? null, {
    enabled: shouldFetchDmWaves,
  });
  const isReconcilingUnreadState = isFetching || isUnreadDmDropsFetching;
  const reconciliationStateRef = useRef<{
    readonly viewerIdentityKey: string;
    readonly mismatchKey: string;
    readonly attempts: number;
    readonly lastDataUpdatedAt: number;
    readonly attemptWindowStartedAt: number;
  } | null>(null);
  const listedUnreadDropsCount = useMemo(
    () =>
      mainWaves.reduce(
        (total, wave) => total + Math.max(wave.unreadDropsCount, 0),
        0
      ),
    [mainWaves]
  );
  const unreadCountsMatch = unreadDmDropsCount === listedUnreadDropsCount;
  const mismatchKey = `${unreadDmDropsCount}:${listedUnreadDropsCount}:${
    hasNextPage === true ? "paginated" : "complete"
  }`;
  const reconciliationKey = `${viewerIdentityKey ?? "none"}:${mismatchKey}`;
  const [paginatedMismatchConfirmation, setPaginatedMismatchConfirmation] =
    useState<{
      readonly reconciliationKey: string;
      readonly confirmed: boolean;
    }>(() => ({ reconciliationKey, confirmed: false }));
  if (paginatedMismatchConfirmation.reconciliationKey !== reconciliationKey) {
    // A confirmation belongs to exactly one mismatch episode. Reset it during
    // render so a later recurrence of the same counts cannot reuse stale trust.
    setPaginatedMismatchConfirmation({
      reconciliationKey,
      confirmed: false,
    });
  }
  const hasConfirmedPaginatedMismatch = Boolean(
    hasNextPage === true &&
    paginatedMismatchConfirmation.reconciliationKey === reconciliationKey &&
    paginatedMismatchConfirmation.confirmed &&
    !isReconcilingUnreadState
  );
  // A paginated aggregate can include rows that have not been loaded. Do not
  // let that fact immediately certify a potentially stale loaded row: require
  // two completed overview reconciliation reads first.
  const unreadSummaryAccountsForLoadedRows =
    unreadCountsMatch || hasConfirmedPaginatedMismatch;
  const canTrustServerSnapshotUnreadState = Boolean(
    shouldFetchDmWaves &&
    !isReconcilingUnreadState &&
    dmWavesDataUpdatedAt > 0 &&
    unreadDmDropsDataUpdatedAt >= dmWavesDataUpdatedAt &&
    unreadSummaryAccountsForLoadedRows
  );

  useEffect(() => {
    if (!shouldFetchDmWaves || !viewerIdentityKey || unreadCountsMatch) {
      reconciliationStateRef.current = null;
      return;
    }

    if (isReconcilingUnreadState) {
      return;
    }

    const previousViewerState =
      reconciliationStateRef.current?.viewerIdentityKey === viewerIdentityKey
        ? reconciliationStateRef.current
        : {
            viewerIdentityKey,
            mismatchKey,
            attempts: 0,
            lastDataUpdatedAt: -1,
            attemptWindowStartedAt: dmWavesDataUpdatedAt,
          };
    const shouldRearm =
      previousViewerState.attempts >= MAX_RECONCILIATION_ATTEMPTS_PER_VIEWER &&
      dmWavesDataUpdatedAt - previousViewerState.attemptWindowStartedAt >=
        RECONCILIATION_REARM_MIN_INTERVAL_MS;
    const previousState = shouldRearm
      ? {
          ...previousViewerState,
          attempts: 0,
          attemptWindowStartedAt: dmWavesDataUpdatedAt,
        }
      : previousViewerState;
    const hasNewDmSnapshot =
      previousState.lastDataUpdatedAt !== dmWavesDataUpdatedAt;
    if (
      previousState.attempts >= MAX_RECONCILIATION_ATTEMPTS_PER_VIEWER ||
      (previousState.attempts > 0 && !hasNewDmSnapshot)
    ) {
      return;
    }

    const nextAttempt = previousState.attempts + 1;
    reconciliationStateRef.current = {
      viewerIdentityKey,
      mismatchKey,
      attempts: nextAttempt,
      lastDataUpdatedAt: dmWavesDataUpdatedAt,
      attemptWindowStartedAt: previousState.attemptWindowStartedAt,
    };
    // Refresh the overview first, then the aggregate, so the trust check never
    // certifies row data using an older account-level summary.
    void queryClient
      .refetchQueries({
        queryKey: dmWavesQueryKey,
        exact: true,
        type: "active",
      })
      .then(() => refetchUnreadDmDrops())
      .then(() => {
        if (
          hasNextPage === true &&
          nextAttempt >= MAX_RECONCILIATION_ATTEMPTS_PER_VIEWER
        ) {
          setPaginatedMismatchConfirmation((current) =>
            current.reconciliationKey === reconciliationKey
              ? { ...current, confirmed: true }
              : current
          );
        }
      })
      .catch(() => undefined);
  }, [
    dmWavesQueryKey,
    dmWavesDataUpdatedAt,
    hasNextPage,
    isReconcilingUnreadState,
    listedUnreadDropsCount,
    mismatchKey,
    queryClient,
    reconciliationKey,
    refetchUnreadDmDrops,
    shouldFetchDmWaves,
    unreadDmDropsCount,
    unreadCountsMatch,
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
      canTrustServerSnapshotUnreadState,
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
      canTrustServerSnapshotUnreadState,
    ]
  );
};

export default useDmWavesList;
