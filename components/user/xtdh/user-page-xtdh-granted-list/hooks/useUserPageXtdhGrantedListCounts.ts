import { useQueries, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import {
  DEFAULT_FILTER_STATUSES,
  DEFAULT_STATUS,
  areAllGrantedStatusesNormalized,
  getApiParamsFromFilters,
  normalizeGrantedStatuses,
  serializeNormalizedUserPageXtdhGrantedListStatuses,
} from "../constants";
import type { GrantedActiveFilter, GrantedTab } from "../types";
import { SortDirection } from "@/entities/ISort";

export interface UseUserPageXtdhGrantedListCountsParams {
  readonly grantor: string;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 25;

export function useUserPageXtdhGrantedListCounts({
  grantor,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseUserPageXtdhGrantedListCountsParams) {
  const queryClient = useQueryClient();
  const tabs: GrantedTab[] = ["ACTIVE", "PENDING", "REVOKED", "FAILED"];
  const activeSubFilters: GrantedActiveFilter[] = [
    "ALL",
    "ENDED",
    "ACTIVE",
    "NOT_STARTED",
  ];

  const getQueryKey = (
    params: ReturnType<typeof getApiParamsFromFilters>
  ) => {
    const normalizedStatuses = normalizeGrantedStatuses(
      params.statuses ?? DEFAULT_FILTER_STATUSES
    );
    const isAllStatuses = areAllGrantedStatusesNormalized(normalizedStatuses);
    const serializedStatuses = isAllStatuses
      ? null
      : serializeNormalizedUserPageXtdhGrantedListStatuses(normalizedStatuses);
    const statusKey = isAllStatuses
      ? DEFAULT_STATUS
      : serializedStatuses ?? DEFAULT_FILTER_STATUSES.join(",");

    return [
      QueryKey.TDH_GRANTS,
      grantor?.toLowerCase() ?? "",
      pageSize,
      statusKey,
      params.validFromGt,
      params.validFromLt,
      params.validToGt,
      params.validToLt,
      "created_at", // Default sort field
      SortDirection.DESC, // Default sort direction
    ];
  };

  const fetchAndSeedCache = async (
    params: ReturnType<typeof getApiParamsFromFilters>,
    key: unknown[]
  ) => {
    const response = await commonApiFetch<ApiTdhGrantsPage>({
      endpoint: "tdh-grants",
      params: {
        grantor,
        page: "1",
        page_size: pageSize.toString(),
        ...(params.statuses ? { status: params.statuses.join(",") } : {}),
        ...(params.validFromGt
          ? { valid_from_gt: params.validFromGt.toString() }
          : {}),
        ...(params.validFromLt
          ? { valid_from_lt: params.validFromLt.toString() }
          : {}),
        ...(params.validToGt
          ? { valid_to_gt: params.validToGt.toString() }
          : {}),
        ...(params.validToLt
          ? { valid_to_lt: params.validToLt.toString() }
          : {}),
        sort: "created_at",
        sort_direction: SortDirection.DESC,
      },
    });

    // Manually seed the infinite query cache
    queryClient.setQueryData(key, {
      pages: [response],
      pageParams: [1],
    });

    return response.count;
  };

  const tabQueries = useQueries({
    queries: tabs.map((tab) => {
      const params = getApiParamsFromFilters(tab, "ALL");
      const key = getQueryKey(params);
      return {
        queryKey: [...key, "prefetch"], // Use a distinct key for this query to avoid conflicts, but we seed the real key
        queryFn: () => fetchAndSeedCache(params, key),
        staleTime: 60 * 1000,
      };
    }),
  });

  const activeSubFilterQueries = useQueries({
    queries: activeSubFilters.map((sub) => {
      const params = getApiParamsFromFilters("ACTIVE", sub);
      const key = getQueryKey(params);
      return {
        queryKey: [...key, "prefetch"],
        queryFn: () => fetchAndSeedCache(params, key),
        staleTime: 60 * 1000,
      };
    }),
  });

  const getTabCount = (tab: GrantedTab) => {
    const index = tabs.indexOf(tab);
    return tabQueries[index]?.data ?? 0;
  };

  const getActiveSubFilterCount = (sub: GrantedActiveFilter) => {
    const index = activeSubFilters.indexOf(sub);
    return activeSubFilterQueries[index]?.data ?? 0;
  };

  return {
    getTabCount,
    getActiveSubFilterCount,
    isLoading:
      tabQueries.some((q) => q.isLoading) ||
      activeSubFilterQueries.some((q) => q.isLoading),
  };
}
