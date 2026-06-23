"use client";

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
import { fetchWaveLeaderboardV2 } from "@/services/api/wave-drops-v2-api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

export enum WaveDropsLeaderboardSort {
  RANK = "RANK",
  PRICE = "PRICE",
  REALTIME_VOTE = "REALTIME_VOTE",
  RATING_PREDICTION = "RATING_PREDICTION",
  TREND = "TREND",
  MY_REALTIME_VOTE = "MY_REALTIME_VOTE",
  CREATED_AT = "CREATED_AT",
}

interface UseWaveDropsLeaderboardProps {
  readonly waveId: string;
  readonly sort?: WaveDropsLeaderboardSort | undefined;
  readonly enabled?: boolean | undefined;
  readonly curatedByGroupId?: string | undefined;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly priceCurrency?: string | undefined;
}

const SORT_DIRECTION_MAP: Record<
  WaveDropsLeaderboardSort,
  "ASC" | "DESC" | undefined
> = {
  [WaveDropsLeaderboardSort.RANK]: undefined,
  [WaveDropsLeaderboardSort.PRICE]: undefined,
  [WaveDropsLeaderboardSort.REALTIME_VOTE]: "DESC",
  [WaveDropsLeaderboardSort.RATING_PREDICTION]: "DESC",
  [WaveDropsLeaderboardSort.TREND]: "DESC",
  [WaveDropsLeaderboardSort.MY_REALTIME_VOTE]: undefined,
  [WaveDropsLeaderboardSort.CREATED_AT]: "DESC",
};

export function useWaveDropsLeaderboard({
  waveId,
  sort = WaveDropsLeaderboardSort.RANK,
  enabled = true,
  curatedByGroupId,
  minPrice,
  maxPrice,
  priceCurrency,
}: UseWaveDropsLeaderboardProps) {
  const queryClient = useQueryClient();

  const sortDirection = SORT_DIRECTION_MAP[sort];
  const isQueryEnabled = enabled && !!waveId;

  const normalizedCuratedByGroupId = useMemo(
    () => curatedByGroupId?.trim() ?? undefined,
    [curatedByGroupId]
  );
  const canonicalPriceFilters = useMemo(() => {
    const trimmedPriceCurrency = priceCurrency?.trim();
    const normalizedPriceCurrency =
      trimmedPriceCurrency && trimmedPriceCurrency.length > 0
        ? trimmedPriceCurrency
        : undefined;
    const normalizedMinPrice =
      typeof minPrice === "number" && Number.isFinite(minPrice) && minPrice >= 0
        ? minPrice
        : undefined;
    const normalizedMaxPrice =
      typeof maxPrice === "number" && Number.isFinite(maxPrice) && maxPrice >= 0
        ? maxPrice
        : undefined;

    let normalizedPriceLower = normalizedMinPrice;
    let normalizedPriceUpper = normalizedMaxPrice;

    if (
      typeof normalizedPriceLower === "number" &&
      typeof normalizedPriceUpper === "number" &&
      normalizedPriceLower > normalizedPriceUpper
    ) {
      normalizedPriceLower = normalizedMaxPrice;
      normalizedPriceUpper = normalizedMinPrice;
    }

    return {
      normalizedPriceCurrency,
      normalizedPriceLower:
        typeof normalizedPriceLower === "number"
          ? normalizedPriceLower.toString()
          : undefined,
      normalizedPriceUpper:
        typeof normalizedPriceUpper === "number"
          ? normalizedPriceUpper.toString()
          : undefined,
    };
  }, [maxPrice, minPrice, priceCurrency]);

  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS_LEADERBOARD,
        {
          waveId,
          page_size: WAVE_DROPS_PARAMS.limit,
          sort,
          sort_direction: sortDirection,
          curation_id: normalizedCuratedByGroupId ?? null,
          min_price: canonicalPriceFilters.normalizedPriceLower ?? null,
          max_price: canonicalPriceFilters.normalizedPriceUpper ?? null,
          price_currency: canonicalPriceFilters.normalizedPriceCurrency ?? null,
        },
      ] as const,
    [
      waveId,
      sort,
      sortDirection,
      normalizedCuratedByGroupId,
      canonicalPriceFilters.normalizedPriceLower,
      canonicalPriceFilters.normalizedPriceUpper,
      canonicalPriceFilters.normalizedPriceCurrency,
    ]
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
        params["curation_id"] = normalizedCuratedByGroupId;
      }
      if (canonicalPriceFilters.normalizedPriceLower) {
        params["min_price"] = canonicalPriceFilters.normalizedPriceLower;
      }
      if (canonicalPriceFilters.normalizedPriceUpper) {
        params["max_price"] = canonicalPriceFilters.normalizedPriceUpper;
      }
      if (canonicalPriceFilters.normalizedPriceCurrency) {
        params["price_currency"] =
          canonicalPriceFilters.normalizedPriceCurrency;
      }

      return params;
    },
    [normalizedCuratedByGroupId, canonicalPriceFilters]
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
      await fetchWaveLeaderboardV2({
        waveId,
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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
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
    enabled: isQueryEnabled,
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

  useEffect(() => {
    return () => {
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
    isError,
    isFetching: isQueryEnabled && (isFetching || !hasInitialized),
    isFetchingNextPage,
    refetch,
    manualFetch,
  };
}
