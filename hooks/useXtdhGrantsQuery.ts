"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { commonApiFetch } from "@/services/api/common-api";
import type {
  GrantedFilterStatuses,
  GrantedSortField,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/types";
import {
  DEFAULT_FILTER_STATUSES,
  normalizeGrantedStatuses,
  serializeUserPageXtdhGrantedListStatuses,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import { SortDirection } from "@/entities/ISort";

export interface UseXtdhGrantsQueryParams {
  readonly grantor: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly statuses?: GrantedFilterStatuses;
  readonly sortField: GrantedSortField;
  readonly sortDirection: SortDirection;
  readonly enabled?: boolean;
}

type XtdhGrantsInfiniteData = InfiniteData<ApiTdhGrantsPage>;

export type UseXtdhGrantsQueryResult = UseInfiniteQueryResult<
  XtdhGrantsInfiniteData,
  Error
> & {
  readonly grants: ApiTdhGrantsPage["data"];
  readonly totalCount: number;
  readonly errorMessage?: string;
  readonly isEnabled: boolean;
  readonly firstPage?: ApiTdhGrantsPage;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
export function useXtdhGrantsQuery({
  grantor,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  statuses = DEFAULT_FILTER_STATUSES,
  sortField,
  sortDirection,
  enabled = true,
}: Readonly<UseXtdhGrantsQueryParams>): UseXtdhGrantsQueryResult {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PAGE_SIZE;
  const normalizedStatuses = normalizeGrantedStatuses(statuses ?? DEFAULT_FILTER_STATUSES);
  const serializedStatuses = serializeUserPageXtdhGrantedListStatuses(normalizedStatuses);
  const isEnabled = Boolean(grantor) && enabled;

  const queryKey = useMemo(
    () => [
      QueryKey.TDH_GRANTS,
      grantor?.toLowerCase() ?? "",
      normalizedPageSize,
      serializedStatuses ?? DEFAULT_FILTER_STATUSES.join(","),
      sortField,
      sortDirection,
    ],
    [grantor, normalizedPageSize, serializedStatuses, sortField, sortDirection]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam?: number }) => {
      const currentPage = pageParam ?? normalizedPage;

      return await commonApiFetch<ApiTdhGrantsPage>({
        endpoint: "tdh-grants",
        params: {
          grantor,
          page: currentPage.toString(),
          page_size: normalizedPageSize.toString(),
          ...(serializedStatuses ? { status: serializedStatuses } : {}),
          sort: sortField,
          sort_direction: sortDirection,
        },
      });
    },
    initialPageParam: normalizedPage,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : undefined),
    enabled: isEnabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const firstPage = query.data?.pages?.[0];
  const grants = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );
  const totalCount = firstPage?.count ?? 0;
  const errorMessage = query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    grants,
    totalCount,
    errorMessage,
    isEnabled,
    firstPage,
  };
}
