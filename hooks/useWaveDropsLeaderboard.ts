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
  [WaveDropsLeaderboardSort.MY_REALTIME_VOTE]: "DESC",
  [WaveDropsLeaderboardSort.CREATED_AT]: "DESC",
};

interface CanonicalPriceFilters {
  readonly normalizedPriceCurrency: string | undefined;
  readonly normalizedPriceLower: string | undefined;
  readonly normalizedPriceUpper: string | undefined;
}

interface LeaderboardQueryKeyInput {
  readonly waveId: string;
  readonly sort: WaveDropsLeaderboardSort;
  readonly sortDirection: "ASC" | "DESC" | undefined;
  readonly priceFilters: CanonicalPriceFilters;
}

interface LeaderboardParamsInput extends LeaderboardQueryKeyInput {
  readonly pageParam: number | null;
  readonly pageSize: number;
}

const normalizePriceFilter = (value?: number): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;

const getCanonicalPriceFilters = ({
  minPrice,
  maxPrice,
  priceCurrency,
}: Pick<
  UseWaveDropsLeaderboardProps,
  "minPrice" | "maxPrice" | "priceCurrency"
>): CanonicalPriceFilters => {
  const trimmedPriceCurrency = priceCurrency?.trim();
  const normalizedPriceCurrency =
    trimmedPriceCurrency && trimmedPriceCurrency.length > 0
      ? trimmedPriceCurrency
      : undefined;
  const normalizedMinPrice = normalizePriceFilter(minPrice);
  const normalizedMaxPrice = normalizePriceFilter(maxPrice);

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
};

const buildLeaderboardQueryKey = ({
  waveId,
  sort,
  sortDirection,
  priceFilters,
}: LeaderboardQueryKeyInput) =>
  [
    QueryKey.DROPS_LEADERBOARD,
    {
      waveId,
      page_size: WAVE_DROPS_PARAMS.limit,
      sort,
      sort_direction: sortDirection,
      min_price: priceFilters.normalizedPriceLower ?? null,
      max_price: priceFilters.normalizedPriceUpper ?? null,
      price_currency: priceFilters.normalizedPriceCurrency ?? null,
    },
  ] as const;

const buildLeaderboardParams = ({
  pageParam,
  pageSize,
  sort,
  sortDirection,
  priceFilters,
}: LeaderboardParamsInput): Record<string, string> => {
  const params: Record<string, string> = {
    page_size: pageSize.toString(),
    sort,
  };

  if (sortDirection) {
    params["sort_direction"] = sortDirection;
  }
  if (typeof pageParam === "number") {
    params["page"] = `${pageParam}`;
  }
  if (priceFilters.normalizedPriceLower) {
    params["min_price"] = priceFilters.normalizedPriceLower;
  }
  if (priceFilters.normalizedPriceUpper) {
    params["max_price"] = priceFilters.normalizedPriceUpper;
  }
  if (priceFilters.normalizedPriceCurrency) {
    params["price_currency"] = priceFilters.normalizedPriceCurrency;
  }

  return params;
};

const fetchLeaderboardPage = ({
  waveId,
  pageParam,
  pageSize,
  sort,
  sortDirection,
  priceFilters,
}: LeaderboardParamsInput) =>
  fetchWaveLeaderboardV2({
    waveId,
    params: buildLeaderboardParams({
      waveId,
      pageParam,
      pageSize,
      sort,
      sortDirection,
      priceFilters,
    }),
  });

const getNextLeaderboardPageParam = ({
  lastPage,
  sort,
}: {
  readonly lastPage: ApiDropsLeaderboardPage;
  readonly sort: WaveDropsLeaderboardSort;
}): number | null => {
  if (sort === WaveDropsLeaderboardSort.MY_REALTIME_VOTE) {
    const haveZeroVotes = lastPage.drops.some(
      (drop) => drop.context_profile_context?.rating === 0
    );
    if (haveZeroVotes) {
      return null;
    }
  }
  return lastPage.next ? lastPage.page + 1 : null;
};

const getLeaderboardDrops = ({
  data,
  sort,
}: {
  readonly data:
    | {
        readonly pages: readonly ApiDropsLeaderboardPage[];
      }
    | undefined;
  readonly sort: WaveDropsLeaderboardSort;
}) => {
  if (!data?.pages) {
    return [];
  }

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
};

const useRemoveDropsQueryOnUnmount = ({
  queryClient,
  waveId,
}: {
  readonly queryClient: ReturnType<typeof useQueryClient>;
  readonly waveId: string;
}) => {
  useEffect(() => {
    return () => {
      queryClient.removeQueries({
        queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId }],
      });
    };
  }, [waveId, queryClient]);
};

export function useWaveDropsLeaderboard({
  waveId,
  sort = WaveDropsLeaderboardSort.RANK,
  enabled = true,
  minPrice,
  maxPrice,
  priceCurrency,
}: UseWaveDropsLeaderboardProps) {
  const queryClient = useQueryClient();

  const sortDirection = SORT_DIRECTION_MAP[sort];
  const isQueryEnabled = enabled && !!waveId;

  const canonicalPriceFilters = useMemo(
    () => getCanonicalPriceFilters({ minPrice, maxPrice, priceCurrency }),
    [maxPrice, minPrice, priceCurrency]
  );

  const queryKey = useMemo(
    () =>
      buildLeaderboardQueryKey({
        waveId,
        sort,
        sortDirection,
        priceFilters: canonicalPriceFilters,
      }),
    [canonicalPriceFilters, sort, sortDirection, waveId]
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
    queryFn: ({ pageParam }: { pageParam: number | null }) =>
      fetchLeaderboardPage({
        waveId,
        pageParam,
        pageSize: WAVE_DROPS_PARAMS.limit,
        sort,
        sortDirection,
        priceFilters: canonicalPriceFilters,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage: ApiDropsLeaderboardPage) =>
      getNextLeaderboardPageParam({ lastPage, sort }),
    enabled: isQueryEnabled,
    staleTime: 60000,
    ...getDefaultQueryRetry(),
  });

  const drops = useMemo(
    () => getLeaderboardDrops({ data, sort }),
    [data, sort]
  );

  // Derive hasInitialized from whether we have data
  const hasInitialized = !!data?.pages;

  useRemoveDropsQueryOnUnmount({ queryClient, waveId });

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
