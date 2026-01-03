"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiXTdhContributionsPage } from "@/generated/models/ApiXTdhContributionsPage";
import type { XtdhTokensOrder, XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";
import {
  DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY,
  DEFAULT_TOKEN_CONTRIBUTORS_SORT_DIRECTION,
  DEFAULT_TOKEN_CONTRIBUTORS_SORT_FIELD,
  type XtdhTokenContributorsGroupBy,
} from "@/components/xtdh/received/constants";
import { SortDirection } from "@/entities/ISort";
import { commonApiFetch } from "@/services/api/common-api";

export interface UseXtdhTokenContributorsQueryParams {
  readonly contract?: string | null | undefined;
  readonly tokenId?: number | null | undefined;
  readonly pageSize?: number | undefined;
  readonly sortField?: XtdhTokensSortField | undefined;
  readonly order?: XtdhTokensOrder | undefined;
  readonly groupBy?: XtdhTokenContributorsGroupBy | undefined;
  readonly enabled?: boolean | undefined;
}

type XtdhTokenContributorsInfiniteData = InfiniteData<ApiXTdhContributionsPage>;

export type UseXtdhTokenContributorsQueryResult = UseInfiniteQueryResult<
  XtdhTokenContributorsInfiniteData,
  Error
> & {
  readonly contributors: ApiXTdhContributionsPage["data"];
  readonly errorMessage?: string | undefined;
  readonly isEnabled: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_STALE_TIME = 30_000;
const SORT_MAP: Record<SortDirection, XtdhTokensOrder> = {
  [SortDirection.ASC]: "ASC",
  [SortDirection.DESC]: "DESC",
};

export function useXtdhTokenContributorsQuery({
  contract,
  tokenId,
  pageSize = DEFAULT_PAGE_SIZE,
  sortField = DEFAULT_TOKEN_CONTRIBUTORS_SORT_FIELD,
  order = SORT_MAP[DEFAULT_TOKEN_CONTRIBUTORS_SORT_DIRECTION],
  groupBy = DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY,
  enabled = true,
}: Readonly<UseXtdhTokenContributorsQueryParams>): UseXtdhTokenContributorsQueryResult {
  const normalizedContract = contract?.trim() ?? "";
  const normalizedTokenId = Number.isFinite(tokenId)
    ? Math.trunc(Number(tokenId)).toString()
    : "";
  const hasRequiredFilters =
    Boolean(normalizedContract) && Boolean(normalizedTokenId);
  const isEnabled = hasRequiredFilters && enabled;
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.floor(pageSize)
      : DEFAULT_PAGE_SIZE;
  const normalizedOrder: XtdhTokensOrder = order === "ASC" ? "ASC" : "DESC";

  const queryKey = useMemo(
    () => [
      QueryKey.XTDH_TOKEN_CONTRIBUTORS,
      normalizedContract.toLowerCase(),
      normalizedTokenId,
      normalizedPageSize,
      sortField,
      normalizedOrder,
      groupBy,
    ],
    [
      normalizedContract,
      normalizedTokenId,
      normalizedPageSize,
      sortField,
      normalizedOrder,
      groupBy,
    ]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam?: number | undefined }) => {
      const currentPage = pageParam ?? DEFAULT_PAGE;
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: normalizedPageSize.toString(),
        sort: sortField,
        order: normalizedOrder,
        group_by: groupBy,
      };

      return commonApiFetch<ApiXTdhContributionsPage>({
        endpoint: `xtdh/tokens/${normalizedContract}/${normalizedTokenId}/contributors`,
        params,
      });
    },
    initialPageParam: DEFAULT_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    enabled: isEnabled,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
  });

  const contributors = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );

  const errorMessage =
    query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    contributors,
    errorMessage,
    isEnabled,
  };
}
