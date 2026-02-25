"use client";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "react-use";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getDefaultQueryRetry,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";
import { commonApiFetch } from "@/services/api/common-api";

import useCapacitor from "./useCapacitor";

export enum WaveDropsLeaderboardSort {
  RANK = "RANK",
  RATING_PREDICTION = "RATING_PREDICTION",
  TREND = "TREND",
  MY_REALTIME_VOTE = "MY_REALTIME_VOTE",
  CREATED_AT = "CREATED_AT",
}

interface UseWaveDropsLeaderboardProps {
  readonly waveId: string;
  readonly sort?: WaveDropsLeaderboardSort | undefined;
  readonly pausePolling?: boolean | undefined;
  readonly curatedByGroupId?: string | undefined;
}

const SORT_DIRECTION_MAP: Record<
  WaveDropsLeaderboardSort,
  "ASC" | "DESC" | undefined
> = {
  [WaveDropsLeaderboardSort.RANK]: undefined,
  [WaveDropsLeaderboardSort.RATING_PREDICTION]: "DESC",
  [WaveDropsLeaderboardSort.TREND]: "DESC",
  [WaveDropsLeaderboardSort.MY_REALTIME_VOTE]: undefined,
  [WaveDropsLeaderboardSort.CREATED_AT]: "DESC",
};

const POLLING_DELAY = 3000;
const ACTIVE_POLLING_INTERVAL = 5000;
const INACTIVE_POLLING_INTERVAL = 30000;

function useTabVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
}

export function useWaveDropsLeaderboard({
  waveId,
  sort = WaveDropsLeaderboardSort.RANK,
  pausePolling = false,
  curatedByGroupId,
}: UseWaveDropsLeaderboardProps) {
  const { isCapacitor } = useCapacitor();
  const queryClient = useQueryClient();

  const [canPoll, setCanPoll] = useState(false);
  const isTabVisible = useTabVisibility();
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortDirection = SORT_DIRECTION_MAP[sort];

  const normalizedCuratedByGroupId = useMemo(
    () => curatedByGroupId?.trim() ?? undefined,
    [curatedByGroupId]
  );

  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS_LEADERBOARD,
        {
          waveId,
          page_size: WAVE_DROPS_PARAMS.limit,
          sort,
          sort_direction: sortDirection,
          curated_by_group: normalizedCuratedByGroupId ?? null,
        },
      ] as const,
    [waveId, sort, sortDirection, normalizedCuratedByGroupId]
  );

  const buildLeaderboardParams = useCallback(
    ({
      pageParam,
      pageSize,
      targetSort,
      targetSortDirection,
    }: {
      readonly pageParam: number | null;
      readonly pageSize: number;
      readonly targetSort: WaveDropsLeaderboardSort;
      readonly targetSortDirection: "ASC" | "DESC" | undefined;
    }) => {
      const params: Record<string, string> = {
        page_size: pageSize.toString(),
        sort: targetSort,
      };

      if (targetSortDirection) {
        params["sort_direction"] = targetSortDirection;
      }

      if (typeof pageParam === "number") {
        params["page"] = `${pageParam}`;
      }

      if (normalizedCuratedByGroupId) {
        params["curated_by_group"] = normalizedCuratedByGroupId;
      }

      return params;
    },
    [normalizedCuratedByGroupId]
  );

  const fetchLeaderboardPage = useCallback(
    async ({
      pageParam,
      pageSize,
      targetSort,
      targetSortDirection,
    }: {
      readonly pageParam: number | null;
      readonly pageSize: number;
      readonly targetSort: WaveDropsLeaderboardSort;
      readonly targetSortDirection: "ASC" | "DESC" | undefined;
    }) =>
      await commonApiFetch<ApiDropsLeaderboardPage>({
        endpoint: `waves/${waveId}/leaderboard`,
        params: buildLeaderboardParams({
          pageParam,
          pageSize,
          targetSort,
          targetSortDirection,
        }),
      }),
    [waveId, buildLeaderboardParams]
  );

  const getNextPageParam = useCallback(
    (lastPage: ApiDropsLeaderboardPage) => {
      if (sort === WaveDropsLeaderboardSort.MY_REALTIME_VOTE) {
        const haveZeroVotes = lastPage.drops.some(
          (drop) => drop.context_profile_context?.rating === 0
        );
        if (haveZeroVotes) {
          return null;
        }
      }
      return lastPage.next ? lastPage.page + 1 : null;
    },
    [sort]
  );

  useEffect(() => {
    if (!waveId) return;
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) =>
        await fetchLeaderboardPage({
          pageParam,
          pageSize: WAVE_DROPS_PARAMS.limit,
          targetSort: sort,
          targetSortDirection: sortDirection,
        }),
      initialPageParam: null,
      getNextPageParam,
      pages: 1,
      staleTime: 60000,
      ...getDefaultQueryRetry(),
    });
  }, [
    fetchLeaderboardPage,
    getNextPageParam,
    queryClient,
    queryKey,
    sort,
    sortDirection,
    waveId,
  ]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | null }) =>
      await fetchLeaderboardPage({
        pageParam,
        pageSize: WAVE_DROPS_PARAMS.limit,
        targetSort: sort,
        targetSortDirection: sortDirection,
      }),
    initialPageParam: null,
    getNextPageParam,
    enabled: !pausePolling && !!waveId,
    staleTime: 60000,
    ...getDefaultQueryRetry(),
  });

  // Derive drops directly during render - no need for state
  const drops = useMemo(() => {
    if (!data?.pages) return [];

    const mappedDrops = mapToExtendedDrops(
      data.pages.map((page) => ({
        wave: page.wave,
        drops: page.drops,
      })),
      []
    );

    const uniqueDrops = generateUniqueKeys(mappedDrops, []);

    if (sort === WaveDropsLeaderboardSort.MY_REALTIME_VOTE) {
      return uniqueDrops.filter(
        (drop) => drop.context_profile_context?.rating !== 0
      );
    }

    return uniqueDrops;
  }, [data, sort]);

  // Derive hasInitialized from whether we have data
  const hasInitialized = !!data?.pages;

  useDebounce(() => setCanPoll(true), 10000, [data]);

  // Check if we can auto-refetch (derived during render)
  const hasTempDrop = useMemo(
    () => drops.some((drop) => drop.id.startsWith("temp-")),
    [drops]
  );
  const canAutoRefetch = isTabVisible && !hasTempDrop;

  // Helper to check if polling result has newer data than current drops
  // Note: We compare against the max created_at across ALL loaded drops,
  // not just drops[0], because drops may be sorted by RANK/TREND (not time)
  const checkForNewDrops = useCallback(
    (pollingData: ApiDropsLeaderboardPage): boolean => {
      if (pollingData.drops.length === 0 || drops.length === 0) return false;

      const latestPolledDrop = pollingData.drops[0];

      // Find the actual newest drop by created_at across all loaded drops
      const newestExistingTimestamp = Math.max(
        ...drops.map((drop) => new Date(drop.created_at).getTime())
      );

      if (latestPolledDrop) {
        const polledCreatedAt = new Date(latestPolledDrop.created_at).getTime();
        return polledCreatedAt > newestExistingTimestamp;
      }

      return true;
    },
    [drops]
  );

  // Polling query with select to determine if there are new drops
  // Uses select to derive haveNewDrops directly from query data
  // Always uses CREATED_AT sort to detect genuinely new drops regardless of main query's sort
  const { data: haveNewDrops = false } = useQuery({
    queryKey: [...queryKey, "polling"],
    queryFn: async () => {
      const result = await fetchLeaderboardPage({
        pageParam: null,
        pageSize: 1,
        targetSort: WaveDropsLeaderboardSort.CREATED_AT,
        targetSortDirection: "DESC",
      });

      // Trigger refetch directly in the query callback when conditions are met
      // This replaces the effect-based approach
      if (canAutoRefetch && checkForNewDrops(result)) {
        // Clear any existing timeout to prevent accumulation
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
        }
        // Use setTimeout to defer the refetch slightly and avoid React Query batching issues
        pollingTimeoutRef.current = setTimeout(() => {
          refetch();
        }, POLLING_DELAY);
      }

      return result;
    },
    select: checkForNewDrops,
    enabled: canPoll && !pausePolling,
    refetchInterval: isTabVisible
      ? ACTIVE_POLLING_INTERVAL
      : INACTIVE_POLLING_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    ...getDefaultQueryRetry(),
  });

  useEffect(() => {
    return () => {
      // Clear polling timeout on unmount to prevent stale refetch calls
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      queryClient.removeQueries({
        queryKey: [QueryKey.DROPS, { waveId }],
      });
    };
  }, [waveId, queryClient]);

  const manualFetch = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetching || !hasInitialized,
    isFetchingNextPage,
    refetch,
    haveNewDrops,
    manualFetch,
  };
}
