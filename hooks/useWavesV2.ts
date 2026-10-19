"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getDefaultQueryRetry,
  getQueryErrorStatus,
} from "@/components/react-query-wrapper/utils/query-utils";
import { refetchQueryIfStale } from "@/components/react-query-wrapper/utils/refetchQueryIfStale";
import type { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import type { ApiWaveVisibilityTier } from "@/generated/models/ApiWaveVisibilityTier";
import type { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import type { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import {
  fetchWavesV2Page,
  fetchJoinedWavesPage,
  getWavesV2OverviewQueryKeyParams,
} from "@/services/api/waves-v2-api";

export { mapApiWaveToSidebarWave } from "@/services/api/waves-v2-api";

const RETRY_FAILURE_COOLDOWN_MS = 30000;

interface UseWavesV2Props {
  readonly joinedSnapshot?: boolean | undefined;
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
  joinedSnapshot = false,
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
    () =>
      [
        QueryKey.WAVES_V2,
        {
          ...queryKeyParams,
          ...(joinedSnapshot ? { pagination: "snapshot" } : {}),
        },
      ] as const,
    [queryKeyParams, joinedSnapshot]
  );
  const [lastErrorTimestamp, setLastErrorTimestamp] = useState<number | null>(
    null
  );
  const handleRetryFailure = useCallback(() => {
    setLastErrorTimestamp(Date.now());
  }, []);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      if (joinedSnapshot) {
        return await fetchJoinedWavesPage({
          cursor: typeof pageParam === "string" ? pageParam : undefined,
          pageSize,
          signal,
        });
      }
      return await fetchWavesV2Page({
        page: Number(pageParam),
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
      });
    },
    initialPageParam: 1 as number | string,
    getNextPageParam: (lastPage) => {
      if (joinedSnapshot) return lastPage.nextCursor ?? null;
      return lastPage.next ? lastPage.page + 1 : null;
    },
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

      if (!joinedSnapshot && previousViewerIdentity === currentViewerIdentity) {
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
    if (joinedSnapshot) {
      if (query.isFetching) return;
      void query
        .fetchNextPage({ cancelRefetch: false })
        .then(async (result) => {
          // Refetch starts at page one and atomically replaces all loaded pages.
          // Never append a fresh first page to the expired snapshot's pages.
          if (getQueryErrorStatus(result.error) === 410) {
            const refreshed = await query.refetch({ cancelRefetch: false });
            if (
              !refreshed.isError &&
              typeof refreshed.data?.pages.at(-1)?.nextCursor === "string"
            ) {
              // Preserve the request to advance after rebuilding the loaded chain.
              await query.fetchNextPage({ cancelRefetch: false });
            }
          }
        })
        .catch(() => undefined);
      return;
    }
    runAfterRetryFailureCooldown(() => {
      query.fetchNextPage().catch(() => undefined);
    });
  }, [runAfterRetryFailureCooldown, query, joinedSnapshot]);

  const retryLoading = useCallback(() => {
    if (query.isFetching) return;
    if (
      query.isFetchNextPageError &&
      getQueryErrorStatus(query.error) !== 410
    ) {
      fetchNextPage();
    } else {
      void query.refetch({ cancelRefetch: false }).catch(() => undefined);
    }
  }, [query, fetchNextPage]);

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
      hasLoadingError: query.isError,
      retryLoading,
      refetch,
      refetchIfStale,
    }),
    [waves, query, fetchNextPage, refetch, refetchIfStale, retryLoading]
  );
};
