"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDropVoteEditLog } from "@/generated/models/ApiDropVoteEditLog";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const DROP_VOTE_LOGS_LIMIT = 20;
const DROP_VOTE_LOGS_SORT_DIRECTION = "DESC";

interface UseDropVoteLogsProps {
  readonly dropId: string;
  readonly enabled?: boolean | undefined;
}

const getNormalizedDropId = (dropId: string): string => dropId.trim();

const getDropVoteLogsEndpoint = (dropId: string): string =>
  `v2/drops/${encodeURIComponent(dropId)}/votes/logs`;

export function useDropVoteLogs({
  dropId,
  enabled = true,
}: UseDropVoteLogsProps) {
  const normalizedDropId = getNormalizedDropId(dropId);
  const canFetch = enabled && normalizedDropId.length > 0;

  const queryKey = useMemo(
    () => [
      QueryKey.DROP_VOTE_LOGS,
      {
        dropId: normalizedDropId,
        limit: DROP_VOTE_LOGS_LIMIT,
        sortDirection: DROP_VOTE_LOGS_SORT_DIRECTION,
      },
    ],
    [normalizedDropId]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number }) =>
      await commonApiFetch<ApiDropVoteEditLog[]>({
        endpoint: getDropVoteLogsEndpoint(normalizedDropId),
        params: {
          limit: DROP_VOTE_LOGS_LIMIT.toString(),
          offset: pageParam.toString(),
          sort_direction: DROP_VOTE_LOGS_SORT_DIRECTION,
        },
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === DROP_VOTE_LOGS_LIMIT
        ? allPages.length * DROP_VOTE_LOGS_LIMIT
        : null,
    placeholderData: keepPreviousData,
    enabled: canFetch,
    staleTime: 60_000,
    ...getDefaultQueryRetry(),
  });

  const logs = useMemo<ApiDropVoteEditLog[]>(
    () => query.data?.pages.flat() ?? [],
    [query.data]
  );

  return {
    logs,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
