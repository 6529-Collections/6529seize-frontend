"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import type { ApiDropVotersPage } from "@/generated/models/ApiDropVotersPage";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const DROP_VOTERS_PAGE_SIZE = 20;
const DROP_VOTERS_SORT_DIRECTION = "DESC";

interface UseDropVotersProps {
  readonly dropId: string;
  readonly enabled?: boolean | undefined;
}

const getNormalizedDropId = (dropId: string): string => dropId.trim();

const getDropVotesEndpoint = (dropId: string): string =>
  `v2/drops/${encodeURIComponent(dropId)}/votes`;

export function useDropVoters({
  dropId,
  enabled = true,
}: UseDropVotersProps) {
  const normalizedDropId = getNormalizedDropId(dropId);
  const canFetch = enabled && normalizedDropId.length > 0;

  const queryKey = useMemo(
    () => [
      QueryKey.DROP_VOTERS,
      {
        dropId: normalizedDropId,
        pageSize: DROP_VOTERS_PAGE_SIZE,
        sortDirection: DROP_VOTERS_SORT_DIRECTION,
      },
    ],
    [normalizedDropId]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await commonApiFetch<ApiDropVotersPage>({
        endpoint: getDropVotesEndpoint(normalizedDropId),
        params: {
          page_size: DROP_VOTERS_PAGE_SIZE.toString(),
          page: pageParam.toString(),
          sort_direction: DROP_VOTERS_SORT_DIRECTION,
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) {
        return null;
      }

      return typeof lastPage.page === "number"
        ? lastPage.page + 1
        : allPages.length + 1;
    },
    placeholderData: keepPreviousData,
    enabled: canFetch,
    staleTime: 60_000,
    ...getDefaultQueryRetry(),
  });

  const voters = useMemo<ApiDropVoter[]>(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data]
  );

  return {
    voters,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
