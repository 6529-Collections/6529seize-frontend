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
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { commonApiFetch } from "@/services/api/common-api";

type XtdhGrantSortField = "created_at" | "valid_from" | "valid_to" | "rate";

interface UseXtdhGrantsSearchQueryParams {
  readonly grantor?: string | null | undefined;
  readonly targetCollectionName?: string | null | undefined;
  readonly targetContract?: string | null | undefined;
  readonly statuses?: readonly ApiXTdhGrantStatus[] | undefined;
  readonly sortField?: XtdhGrantSortField | undefined;
  readonly sortDirection?: SortDirection | undefined;
  readonly pageSize?: number | undefined;
  readonly enabled?: boolean | undefined;
}

type XtdhGrantsInfiniteData = InfiniteData<ApiXTdhGrantsPage>;

type UseXtdhGrantsSearchQueryResult = UseInfiniteQueryResult<
  XtdhGrantsInfiniteData,
  Error
> & {
  readonly grants: ApiXTdhGrant[];
  readonly totalCount: number;
  readonly errorMessage?: string | undefined;
  readonly isEnabled: boolean;
  readonly firstPage?: ApiXTdhGrantsPage | undefined;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 2000;
const DEFAULT_SORT_FIELD: XtdhGrantSortField = "created_at";
const DEFAULT_SORT_DIRECTION: SortDirection = SortDirection.DESC;
const DEFAULT_STALE_TIME = 30_000; // 30 seconds
const XTDH_GRANT_STATUS_SORT_RANK: Readonly<Record<string, number>> = {
  [ApiXTdhGrantStatus.Pending]: 0,
  [ApiXTdhGrantStatus.Failed]: 1,
  [ApiXTdhGrantStatus.Disabled]: 2,
  [ApiXTdhGrantStatus.Granted]: 3,
};

const compareXtdhGrantStatuses = (
  left: ApiXTdhGrantStatus,
  right: ApiXTdhGrantStatus
): number => {
  const leftRank = XTDH_GRANT_STATUS_SORT_RANK[left];
  const rightRank = XTDH_GRANT_STATUS_SORT_RANK[right];

  if (leftRank !== undefined && rightRank !== undefined) {
    return leftRank - rightRank;
  }

  if (leftRank !== undefined) {
    return -1;
  }

  if (rightRank !== undefined) {
    return 1;
  }

  return left.localeCompare(right);
};

const normalizeTextFilter = (value?: string | null): string => {
  const normalized = value?.trim() ?? "";
  return normalized.length ? normalized : "";
};

const normalizeStatuses = (
  statuses?: readonly ApiXTdhGrantStatus[]
): ApiXTdhGrantStatus[] => {
  if (statuses === undefined || statuses.length === 0) {
    return [];
  }
  return Array.from(new Set(statuses)).sort(compareXtdhGrantStatuses);
};

export function useXtdhGrantsSearchQuery({
  grantor,
  targetCollectionName,
  targetContract,
  statuses,
  sortField = DEFAULT_SORT_FIELD,
  sortDirection = DEFAULT_SORT_DIRECTION,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: Readonly<UseXtdhGrantsSearchQueryParams>): UseXtdhGrantsSearchQueryResult {
  const normalizedGrantor = normalizeTextFilter(grantor);
  const normalizedTargetCollectionName =
    normalizeTextFilter(targetCollectionName);
  const normalizedTargetContract = normalizeTextFilter(targetContract);
  const normalizedStatuses = normalizeStatuses(statuses);
  const serializedStatuses = normalizedStatuses.join(",");
  const normalizedPageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(pageSize))
  );
  const isEnabled = enabled;

  const queryKey = useMemo(
    () => [
      QueryKey.TDH_GRANTS,
      "group-create-grants-search",
      normalizedGrantor,
      normalizedTargetCollectionName,
      normalizedTargetContract,
      serializedStatuses || "ALL",
      sortField,
      sortDirection,
      normalizedPageSize,
    ],
    [
      normalizedGrantor,
      normalizedTargetCollectionName,
      normalizedTargetContract,
      serializedStatuses,
      sortField,
      sortDirection,
      normalizedPageSize,
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
        sort_direction: sortDirection,
      };

      if (normalizedGrantor) {
        params["grantor"] = normalizedGrantor;
      }
      if (normalizedTargetCollectionName) {
        params["target_collection_name"] = normalizedTargetCollectionName;
      }
      if (normalizedTargetContract) {
        params["target_contract"] = normalizedTargetContract;
      }
      if (serializedStatuses) {
        params["status"] = serializedStatuses;
      }

      return await commonApiFetch<ApiXTdhGrantsPage>({
        endpoint: "xtdh/grants",
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

  const firstPage = query.data?.pages[0];
  const grants = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );
  const totalCount = firstPage?.count ?? 0;
  const errorMessage =
    query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    grants,
    totalCount,
    errorMessage,
    isEnabled,
    firstPage,
  };
}
