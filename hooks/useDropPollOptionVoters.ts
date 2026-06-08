"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiIdentityOverview } from "@/generated/models/ApiIdentityOverview";
import { fetchDropPollOptionVotersV2 } from "@/services/api/wave-drops-v2-api";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const DROP_POLL_OPTION_VOTERS_PAGE_SIZE = 20;

interface UseDropPollOptionVotersProps {
  readonly dropId: string;
  readonly optionNo: number | null;
  readonly enabled?: boolean | undefined;
}

export function useDropPollOptionVoters({
  dropId,
  optionNo,
  enabled = true,
}: UseDropPollOptionVotersProps) {
  const normalizedDropId = dropId.trim();
  const canFetch =
    enabled && normalizedDropId.length > 0 && typeof optionNo === "number";

  const queryKey = useMemo(
    () => [
      QueryKey.DROP_POLL_VOTERS,
      {
        dropId: normalizedDropId,
        optionNo,
        pageSize: DROP_POLL_OPTION_VOTERS_PAGE_SIZE,
      },
    ],
    [normalizedDropId, optionNo]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (optionNo === null) {
        throw new Error("Cannot fetch poll voters without an option number");
      }

      return await fetchDropPollOptionVotersV2({
        dropId: normalizedDropId,
        optionNo,
        page: pageParam,
        pageSize: DROP_POLL_OPTION_VOTERS_PAGE_SIZE,
      });
    },
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

  const voters = useMemo<ApiIdentityOverview[]>(
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
  };
}
