"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type {
  XtdhReceivedCollectionOption,
  XtdhReceivedNft,
  XtdhReceivedNftsResponse,
} from "@/types/xtdh";

export type XtdhReceivedSortField =
  | "xtdh_rate"
  | "total_received"
  | "token_id"
  | "collection_name";

export type XtdhReceivedSortDirection = "asc" | "desc";

export interface UseXtdhReceivedNftsQueryParams {
  readonly profileId: string | null;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortField?: XtdhReceivedSortField;
  readonly sortDirection?: XtdhReceivedSortDirection;
  readonly collections?: string[];
  readonly enabled?: boolean;
}

export type UseXtdhReceivedNftsQueryResult = UseQueryResult<
  XtdhReceivedNftsResponse,
  Error
> & {
  readonly tokens: readonly XtdhReceivedNft[];
  readonly totalCount: number;
  readonly availableCollections: readonly XtdhReceivedCollectionOption[];
  readonly errorMessage?: string;
  readonly isEnabled: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_FIELD: XtdhReceivedSortField = "xtdh_rate";
const DEFAULT_SORT_DIRECTION: XtdhReceivedSortDirection = "desc";

export function useXtdhReceivedNftsQuery({
  profileId,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  sortField = DEFAULT_SORT_FIELD,
  sortDirection = DEFAULT_SORT_DIRECTION,
  collections,
  enabled = true,
}: Readonly<UseXtdhReceivedNftsQueryParams>): UseXtdhReceivedNftsQueryResult {
  const normalizedProfileId = profileId?.trim();
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PAGE_SIZE;
  const normalizedCollections = collections?.map((value) => value.trim()).filter(Boolean);
  const isEnabled = Boolean(normalizedProfileId) && enabled;
  const collectionsKey = normalizedCollections?.join(",") ?? "__all";

  const queryKey = useMemo(
    () => [
      QueryKey.XTDH_RECEIVED_NFTS,
      normalizedProfileId?.toLowerCase() ?? "",
      normalizedPage,
      normalizedPageSize,
      sortField,
      sortDirection,
      collectionsKey,
    ],
    [
      normalizedProfileId,
      normalizedPage,
      normalizedPageSize,
      sortField,
      sortDirection,
      collectionsKey,
    ]
  );

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!normalizedProfileId) {
        throw new Error("Unable to load xTDH received tokens without a profile identifier");
      }

      return await commonApiFetch<XtdhReceivedNftsResponse>({
        endpoint: `profiles/${normalizedProfileId}/xtdh/received/nfts`,
        params: {
          page: normalizedPage.toString(),
          page_size: normalizedPageSize.toString(),
          sort: sortField,
          dir: sortDirection,
          ...(normalizedCollections?.length
            ? { collections: normalizedCollections.join(",") }
            : {}),
        },
      });
    },
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    ...query,
    tokens: query.data?.nfts ?? [],
    totalCount: query.data?.totalCount ?? 0,
    availableCollections: query.data?.availableCollections ?? [],
    errorMessage:
      query.error instanceof Error && query.error.message.trim() ? query.error.message : undefined,
    isEnabled,
  };
}
