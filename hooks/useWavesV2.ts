"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import { refetchQueryIfStale } from "@/components/react-query-wrapper/utils/refetchQueryIfStale";
import type { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import type { ApiWaveVisibilityTier } from "@/generated/models/ApiWaveVisibilityTier";
import type { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import type { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import {
  fetchWavesV2Page,
  getWavesV2OverviewQueryKeyParams,
} from "@/services/api/waves-v2-api";

export { mapApiWaveToSidebarWave } from "@/services/api/waves-v2-api";

const RETRY_FAILURE_COOLDOWN_MS = 30000;

interface UseWavesV2Props {
  readonly overviewType: ApiWavesOverviewType;
  readonly pageSize?: number | undefined;
  readonly following?: boolean | undefined;
  readonly viewerIdentityKey?: string | null | undefined;
  readonly directMessage?: boolean | undefined;
  readonly pinned?: ApiWavesPinFilter | undefined;
  readonly excludeFollowed?: boolean | undefined;
  readonly scoreSort?: ApiWaveScoreSort | undefined;
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
  readonly visibilityTier?: ApiWaveVisibilityTier | undefined;
  readonly refetchInterval?: number | false | undefined;
  readonly refetchIntervalInBackground?: boolean | undefined;
  readonly enabled?: boolean | undefined;
}

export const useWavesV2 = ({
  overviewType,
  pageSize = 20,
  following = false,
  viewerIdentityKey,
  directMessage,
  pinned,
  excludeFollowed,
  scoreSort,
  minVisibilityScore,
  minQualityScore,
  minHotnessScore,
  minRepSortScore,
  visibilityTier,
  refetchInterval = Infinity,
  refetchIntervalInBackground = false,
  enabled = true,
}: UseWavesV2Props) => {
  const queryKeyParams = useMemo(
    () =>
      getWavesV2OverviewQueryKeyParams({
        overviewType,
        pageSize,
        following,
        directMessage,
        pinned,
        excludeFollowed,
        scoreSort,
        minVisibilityScore,
        minQualityScore,
        minHotnessScore,
        minRepSortScore,
        visibilityTier,
        viewerIdentityKey,
      }),
    [
      overviewType,
      pageSize,
      following,
      directMessage,
      pinned,
      excludeFollowed,
      scoreSort,
      minVisibilityScore,
      minQualityScore,
      minHotnessScore,
      minRepSortScore,
      visibilityTier,
      viewerIdentityKey,
    ]
  );

  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => [QueryKey.WAVES_V2, queryKeyParams] as const,
    [queryKeyParams]
  );
  const [lastErrorTimestamp, setLastErrorTimestamp] = useState<number | null>(
    null
  );
  const handleRetryFailure = useCallback(() => {
    setLastErrorTimestamp(Date.now());
  }, []);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await fetchWavesV2Page({
        page: pageParam,
        pageSize,
        overviewType,
        following,
        directMessage,
        pinned,
        excludeFollowed,
        scoreSort,
        minVisibilityScore,
        minQualityScore,
        minHotnessScore,
        minRepSortScore,
        visibilityTier,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    placeholderData: (previousData, previousQuery) => {
      const previousParams =
        previousQuery === undefined
          ? undefined
          : (previousQuery.queryKey[1] as
              | { viewer_identity?: string | null }
              | undefined);
      const previousViewerIdentity =
        typeof previousParams?.viewer_identity === "string"
          ? previousParams.viewer_identity
          : null;
      const currentViewerIdentity = queryKeyParams.viewer_identity ?? null;

      if (previousViewerIdentity === currentViewerIdentity) {
        return previousData;
      }

      return undefined;
    },
    refetchInterval,
    refetchIntervalInBackground,
    enabled,
    ...getDefaultQueryRetry(handleRetryFailure),
  });

  const waves = useMemo(
    () => query.data?.pages.flatMap((page) => page.waves) ?? [],
    [query.data]
  );

  // After retries are exhausted, hold further requests for a cooldown period.
  const runAfterRetryFailureCooldown = useCallback(
    (task: () => void) => {
      if (
        lastErrorTimestamp !== null &&
        Date.now() - lastErrorTimestamp < RETRY_FAILURE_COOLDOWN_MS
      ) {
        setTimeout(task, RETRY_FAILURE_COOLDOWN_MS);
        return;
      }
      task();
    },
    [lastErrorTimestamp]
  );

  const fetchNextPage = useCallback(() => {
    runAfterRetryFailureCooldown(() => {
      query.fetchNextPage().catch(() => undefined);
    });
  }, [runAfterRetryFailureCooldown, query]);

  const refetch = useCallback(() => {
    runAfterRetryFailureCooldown(() => {
      query.refetch().catch(() => undefined);
    });
  }, [runAfterRetryFailureCooldown, query]);

  // Resync helper: keeps data that is still fresh and never cancels a request
  // that is already in flight.
  const refetchIfStale = useCallback(() => {
    runAfterRetryFailureCooldown(() => {
      refetchQueryIfStale(queryClient, queryKey);
    });
  }, [runAfterRetryFailureCooldown, queryClient, queryKey]);

  return useMemo(
    () => ({
      waves,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      fetchNextPage,
      status: query.status,
      refetch,
      refetchIfStale,
    }),
    [waves, query, fetchNextPage, refetch, refetchIfStale]
  );
};
