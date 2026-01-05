"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";
import { commonApiFetch } from "@/services/api/common-api";

export type XtdhCollectionsSortField = "xtdh" | "xtdh_rate";
export type XtdhCollectionsOrder = "ASC" | "DESC";

export interface UseXtdhCollectionsQueryParams {
  readonly identity?: string | null | undefined;
  readonly pageSize?: number | undefined;
  readonly sortField?: XtdhCollectionsSortField | undefined;
  readonly order?: XtdhCollectionsOrder | undefined;
  readonly enabled?: boolean | undefined;
  readonly requireIdentity?: boolean | undefined;
  readonly collectionName?: string | undefined;
}

type XtdhCollectionsInfiniteData = InfiniteData<ApiXTdhCollectionsPage>;

export type UseXtdhCollectionsQueryResult = UseInfiniteQueryResult<
  XtdhCollectionsInfiniteData,
  Error
> & {
  readonly collections: ApiXTdhCollectionsPage["data"];
  readonly errorMessage?: string | undefined;
  readonly isEnabled: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_FIELD: XtdhCollectionsSortField = "xtdh";
const DEFAULT_ORDER: XtdhCollectionsOrder = "DESC";
const DEFAULT_STALE_TIME = 30_000;

export function useXtdhCollectionsQuery({
  identity,
  pageSize = DEFAULT_PAGE_SIZE,
  sortField = DEFAULT_SORT_FIELD,
  order = DEFAULT_ORDER,
  enabled = true,
  requireIdentity = true,
  collectionName,
}: Readonly<UseXtdhCollectionsQueryParams>): UseXtdhCollectionsQueryResult {
  const normalizedIdentity = identity?.trim() ?? "";
  const hasIdentity = Boolean(normalizedIdentity);
  const identityRequirementMet = requireIdentity ? hasIdentity : true;
  const isEnabled = identityRequirementMet && enabled;
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0
    ? Math.floor(pageSize)
    : DEFAULT_PAGE_SIZE;
  const normalizedOrder: XtdhCollectionsOrder = order === "ASC" ? "ASC" : "DESC";

  const queryKey = useMemo(
    () => [
      QueryKey.XTDH_RECEIVED_NFTS,
      normalizedIdentity.toLowerCase(),
      normalizedPageSize,
      sortField,
      normalizedOrder,
      requireIdentity,
      collectionName,
    ],
    [normalizedIdentity, normalizedPageSize, sortField, normalizedOrder, requireIdentity, collectionName]
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
      };
      if (hasIdentity) {
        params["identity"] = normalizedIdentity;
      }
      if (collectionName) {
        params["collection_name"] = collectionName;
      }

      return commonApiFetch<ApiXTdhCollectionsPage>({
        endpoint: "xtdh/collections",
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

  const collections = useMemo(
    () => query.data?.pages.flatMap((pageData) => pageData.data) ?? [],
    [query.data]
  );
  const errorMessage =
    query.error instanceof Error ? query.error.message : undefined;

  return {
    ...query,
    collections,
    errorMessage,
    isEnabled,
  };
}
