"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import { commonApiFetch } from "@/services/api/common-api";
import type {
  GrantedFilterStatuses,
  GrantedSortField,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/types";
import {
  DEFAULT_STATUS,
  DEFAULT_FILTER_STATUSES,
  normalizeGrantedStatuses,
  serializeNormalizedUserPageXtdhGrantedListStatuses,
  areAllGrantedStatusesNormalized,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import type { SortDirection } from "@/entities/ISort";

export interface UseXtdhGrantsQueryParams {
  readonly grantor: string;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly statuses?: GrantedFilterStatuses | undefined;
  readonly validFromGt?: number | undefined;
  readonly validFromLt?: number | undefined;
  readonly validToGt?: number | undefined;
  readonly validToLt?: number | undefined;
  readonly sortField: GrantedSortField;
  readonly sortDirection: SortDirection;
  readonly enabled?: boolean | undefined;
}

type XtdhGrantsInfiniteData = InfiniteData<ApiXTdhGrantsPage>;

export type UseXtdhGrantsQueryResult = UseInfiniteQueryResult<
  XtdhGrantsInfiniteData,
  Error
> & {
  readonly grants: ApiXTdhGrantsPage["data"];
  readonly totalCount: number;
  readonly errorMessage?: string | undefined;
  readonly isEnabled: boolean;
  readonly firstPage?: ApiXTdhGrantsPage | undefined;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_STALE_TIME = 30_000; // 30 seconds
export function useXtdhGrantsQuery({
  grantor,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  statuses = DEFAULT_FILTER_STATUSES,
  validFromGt,
  validFromLt,
  validToGt,
  validToLt,
  sortField,
  sortDirection,
  enabled = true,
}: Readonly<UseXtdhGrantsQueryParams>): UseXtdhGrantsQueryResult {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PAGE_SIZE;
  const normalizedStatuses = normalizeGrantedStatuses(statuses ?? DEFAULT_FILTER_STATUSES);
  const isAllStatuses = areAllGrantedStatusesNormalized(normalizedStatuses);
  const serializedStatuses = isAllStatuses
    ? null
    : serializeNormalizedUserPageXtdhGrantedListStatuses(normalizedStatuses);
  const isEnabled = Boolean(grantor) && enabled;
  const statusKey = isAllStatuses
    ? DEFAULT_STATUS
    : serializedStatuses ?? DEFAULT_FILTER_STATUSES.join(",");

  const queryKey = useMemo(
    () => [
      QueryKey.TDH_GRANTS,
      grantor?.toLowerCase() ?? "",
      normalizedPageSize,
      statusKey,
      validFromGt,
      validFromLt,
      validToGt,
      validToLt,
      sortField,
      sortDirection,
    ],
    [
      grantor,
      normalizedPageSize,
      statusKey,
      validFromGt,
      validFromLt,
      validToGt,
      validToLt,
      sortField,
      sortDirection,
    ]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam?: number | undefined }) => {
      const currentPage = pageParam ?? normalizedPage;

      return await commonApiFetch<ApiXTdhGrantsPage>({
        endpoint: "xtdh/grants",
        params: {
          grantor,
          page: currentPage.toString(),
          page_size: normalizedPageSize.toString(),
          ...(serializedStatuses ? { status: serializedStatuses } : {}),
          ...(validFromGt ? { valid_from_gt: validFromGt.toString() } : {}),
          ...(validFromLt ? { valid_from_lt: validFromLt.toString() } : {}),
          ...(validToGt ? { valid_to_gt: validToGt.toString() } : {}),
          ...(validToLt ? { valid_to_lt: validToLt.toString() } : {}),
          sort: sortField,
          sort_direction: sortDirection,
        },
      });
    },
    initialPageParam: normalizedPage,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : undefined),
    enabled: isEnabled,
    staleTime: DEFAULT_STALE_TIME,
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
