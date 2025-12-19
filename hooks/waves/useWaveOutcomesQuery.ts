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
import type { ApiWaveOutcomesPage } from "@/generated/models/ApiWaveOutcomesPage";
import { commonApiFetch } from "@/services/api/common-api";

export type WaveOutcomesSortDirection = "ASC" | "DESC";

export interface UseWaveOutcomesQueryParams {
  readonly waveId?: string | null;
  readonly pageSize?: number;
  readonly sortDirection?: WaveOutcomesSortDirection;
  readonly enabled?: boolean;
}

type WaveOutcomesInfiniteData = InfiniteData<ApiWaveOutcomesPage>;

export type UseWaveOutcomesQueryResult = UseInfiniteQueryResult<
  WaveOutcomesInfiniteData,
  Error
> & {
  readonly outcomes: ApiWaveOutcomesPage["data"];
  readonly errorMessage?: string;
  readonly isEnabled: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_SORT_DIRECTION: WaveOutcomesSortDirection = "DESC";
const DEFAULT_STALE_TIME = 30_000;

export function useWaveOutcomesQuery({
  waveId,
  pageSize = DEFAULT_PAGE_SIZE,
  sortDirection = DEFAULT_SORT_DIRECTION,
  enabled = true,
}: Readonly<UseWaveOutcomesQueryParams>): UseWaveOutcomesQueryResult {
  const normalizedWaveId = waveId?.trim() ?? "";
  const hasWaveId = Boolean(normalizedWaveId);
  const isEnabled = hasWaveId && enabled;
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.floor(pageSize)
      : DEFAULT_PAGE_SIZE;
  const normalizedSortDirection: WaveOutcomesSortDirection =
    sortDirection === "ASC" ? "ASC" : "DESC";

  const queryKey = useMemo(
    () => [
      QueryKey.WAVE_OUTCOMES,
      normalizedWaveId,
      normalizedPageSize,
      normalizedSortDirection,
    ],
    [normalizedWaveId, normalizedPageSize, normalizedSortDirection]
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

      return commonApiFetch<ApiWaveOutcomesPage>({
        endpoint: `waves/${normalizedWaveId}/outcomes`,
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

  const outcomes = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );

  const errorMessage =
    query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    outcomes,
    errorMessage,
    isEnabled,
  };
}
