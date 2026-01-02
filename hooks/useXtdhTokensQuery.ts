"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiXTdhTokensPage } from "@/generated/models/ApiXTdhTokensPage";
import { commonApiFetch } from "@/services/api/common-api";

export type XtdhTokensSortField = "xtdh" | "xtdh_rate";
export type XtdhTokensOrder = "ASC" | "DESC";

export interface UseXtdhTokensQueryParams {
  readonly identity?: string | null | undefined;
  readonly contract?: string | null | undefined;
  readonly pageSize?: number | undefined;
  readonly sortField?: XtdhTokensSortField | undefined;
  readonly order?: XtdhTokensOrder | undefined;
  readonly enabled?: boolean | undefined;
  readonly requireIdentity?: boolean | undefined;
}

type XtdhTokensInfiniteData = InfiniteData<ApiXTdhTokensPage>;

export type UseXtdhTokensQueryResult = UseInfiniteQueryResult<
  XtdhTokensInfiniteData,
  Error
> & {
  readonly tokens: ApiXTdhTokensPage["data"];
  readonly errorMessage?: string | undefined;
  readonly isEnabled: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_FIELD: XtdhTokensSortField = "xtdh";
const DEFAULT_ORDER: XtdhTokensOrder = "DESC";
const DEFAULT_STALE_TIME = 30_000;

export function useXtdhTokensQuery({
  identity,
  contract,
  pageSize = DEFAULT_PAGE_SIZE,
  sortField = DEFAULT_SORT_FIELD,
  order = DEFAULT_ORDER,
  enabled = true,
  requireIdentity = true,
}: Readonly<UseXtdhTokensQueryParams>): UseXtdhTokensQueryResult {
  const normalizedIdentity = identity?.trim() ?? "";
  const normalizedContract = contract?.trim() ?? "";
  const hasIdentity = Boolean(normalizedIdentity);
  const identityRequirementMet = requireIdentity ? hasIdentity : true;
  const hasRequiredFilters = identityRequirementMet && Boolean(normalizedContract);
  const isEnabled = hasRequiredFilters && enabled;
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0
    ? Math.floor(pageSize)
    : DEFAULT_PAGE_SIZE;
  const normalizedOrder: XtdhTokensOrder = order === "ASC" ? "ASC" : "DESC";

  const queryKey = useMemo(
    () => [
      QueryKey.XTDH_TOKENS,
      normalizedIdentity.toLowerCase(),
      normalizedContract.toLowerCase(),
      normalizedPageSize,
      sortField,
      normalizedOrder,
      requireIdentity,
    ],
    [
      normalizedIdentity,
      normalizedContract,
      normalizedPageSize,
      sortField,
      normalizedOrder,
      requireIdentity,
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
        contract: normalizedContract,
      };
      if (hasIdentity) {
        params["identity"] = normalizedIdentity;
      }

      return commonApiFetch<ApiXTdhTokensPage>({
        endpoint: "xtdh/tokens",
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

  const tokens = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );

  const errorMessage =
    query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    tokens,
    errorMessage,
    isEnabled,
  };
}
