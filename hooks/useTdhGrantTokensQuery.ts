"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SortDirection } from "@/entities/ISort";
import type { ApiXTdhGrantToken } from "@/generated/models/ApiXTdhGrantToken";
import type { ApiXTdhGrantTokensPage } from "@/generated/models/ApiXTdhGrantTokensPage";
import { commonApiFetch } from "@/services/api/common-api";

const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 2000;

export interface UseTdhGrantTokensQueryParams {
  readonly grantId: string;
  readonly pageSize?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export type UseTdhGrantTokensQueryResult = UseInfiniteQueryResult<
  InfiniteData<ApiXTdhGrantTokensPage>,
  Error
> & {
  readonly tokens: ApiXTdhGrantToken[];
  readonly totalCount: number;
};

export function useTdhGrantTokensQuery({
  grantId,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: Readonly<UseTdhGrantTokensQueryParams>): UseTdhGrantTokensQueryResult {
  const normalizedPageSize = normalizePageSize(pageSize);
  const isEnabled = Boolean(grantId) && enabled;

  const query = useInfiniteQuery({
    queryKey: [QueryKey.TDH_GRANT_TOKENS, grantId, normalizedPageSize],
    enabled: isEnabled,
    initialPageParam: 1,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam = 1 }) =>
      await commonApiFetch<ApiXTdhGrantTokensPage>({
        endpoint: `xtdh/grants/${grantId}/tokens`,
        params: {
          page: pageParam.toString(),
          page_size: normalizedPageSize.toString(),
          sort: "token",
          sort_direction: SortDirection.ASC,
        },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
  });

  const tokens = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data]
  );
  const totalCount = query.data?.pages?.[0]?.count ?? 0;

  return {
    ...query,
    tokens,
    totalCount,
  };
}

function normalizePageSize(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}
