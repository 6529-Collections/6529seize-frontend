"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiWaveOutcomeDistributionItemsPage } from "@/generated/models/ApiWaveOutcomeDistributionItemsPage";
import { commonApiFetch } from "@/services/api/common-api";

export type WaveOutcomeDistributionSortDirection = "ASC" | "DESC";

export interface UseWaveOutcomeDistributionQueryParams {
  readonly waveId?: string | null;
  readonly outcomeIndex?: string | number | null;
  readonly pageSize?: number;
  readonly sortDirection?: WaveOutcomeDistributionSortDirection;
  readonly enabled?: boolean;
}

type WaveOutcomeDistributionInfiniteData =
  InfiniteData<ApiWaveOutcomeDistributionItemsPage>;

export type UseWaveOutcomeDistributionQueryResult = UseInfiniteQueryResult<
  WaveOutcomeDistributionInfiniteData,
  Error
> & {
  readonly items: ApiWaveOutcomeDistributionItemsPage["data"];
  readonly totalCount: number;
  readonly errorMessage?: string;
  readonly isEnabled: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_SORT_DIRECTION: WaveOutcomeDistributionSortDirection = "ASC";
const DEFAULT_STALE_TIME = 30_000;

export function useWaveOutcomeDistributionQuery({
  waveId,
  outcomeIndex,
  pageSize = DEFAULT_PAGE_SIZE,
  sortDirection = DEFAULT_SORT_DIRECTION,
  enabled = true,
}: Readonly<UseWaveOutcomeDistributionQueryParams>): UseWaveOutcomeDistributionQueryResult {
  const normalizedWaveId = waveId?.trim() ?? "";
  const normalizedOutcomeIndex =
    outcomeIndex == null ? "" : String(outcomeIndex).trim();
  const hasRequiredParams =
    Boolean(normalizedWaveId) && Boolean(normalizedOutcomeIndex);
  const isEnabled = hasRequiredParams && enabled;
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.floor(pageSize)
      : DEFAULT_PAGE_SIZE;
  const normalizedSortDirection: WaveOutcomeDistributionSortDirection =
    sortDirection === "DESC" ? "DESC" : "ASC";

  const queryKey = useMemo(
    () => [
      QueryKey.WAVE_OUTCOME_DISTRIBUTION,
      normalizedWaveId,
      normalizedOutcomeIndex,
      normalizedPageSize,
      normalizedSortDirection,
    ],
    [
      normalizedWaveId,
      normalizedOutcomeIndex,
      normalizedPageSize,
      normalizedSortDirection,
    ]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam?: number }) => {
      const currentPage = pageParam ?? DEFAULT_PAGE;
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: normalizedPageSize.toString(),
        sort_direction: normalizedSortDirection,
      };

      return commonApiFetch<ApiWaveOutcomeDistributionItemsPage>({
        endpoint: `waves/${normalizedWaveId}/outcomes/${normalizedOutcomeIndex}/distribution`,
        params,
      });
    },
    initialPageParam: DEFAULT_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    enabled: isEnabled,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
    ...getDefaultQueryRetry(),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );
  const totalCount = query.data?.pages[0]?.count ?? 0;

  const errorMessage =
    query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    items,
    totalCount,
    errorMessage,
    isEnabled,
  };
}
