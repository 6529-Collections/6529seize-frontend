"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDropPollVotersPage } from "@/generated/models/ApiDropPollVotersPage";
import type { ApiIdentityOverview } from "@/generated/models/ApiIdentityOverview";
import { fetchDropPollOptionVotersV2 } from "@/services/api/wave-drops-v2-api";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const DROP_POLL_OPTION_VOTERS_PAGE_SIZE = 20;
const DROP_POLL_OPTION_VOTERS_STALE_TIME_MS = 60_000;

interface UseDropPollOptionVotersProps {
  readonly dropId: string;
  readonly optionNo: number | null;
  readonly enabled?: boolean | undefined;
  readonly pageSize?: number | undefined;
}

interface DropPollOptionVotersParams {
  readonly dropId: string;
  readonly optionNo: number | null;
  readonly pageSize?: number | undefined;
}

const getDropPollOptionVotersQueryKey = ({
  dropId,
  optionNo,
  pageSize = DROP_POLL_OPTION_VOTERS_PAGE_SIZE,
}: DropPollOptionVotersParams) => [
  QueryKey.DROP_POLL_VOTERS,
  {
    dropId: dropId.trim(),
    optionNo,
    pageSize,
  },
];

const getNextDropPollOptionVotersPageParam = (
  lastPage: ApiDropPollVotersPage,
  allPages: ApiDropPollVotersPage[]
) => {
  if (!lastPage.next) {
    return null;
  }

  return typeof lastPage.page === "number"
    ? lastPage.page + 1
    : allPages.length + 1;
};

const fetchDropPollOptionVotersPage = async ({
  dropId,
  optionNo,
  pageParam,
  pageSize = DROP_POLL_OPTION_VOTERS_PAGE_SIZE,
  signal,
}: DropPollOptionVotersParams & {
  readonly pageParam: number;
  readonly signal?: AbortSignal | undefined;
}) => {
  if (optionNo === null) {
    throw new Error("Cannot fetch poll voters without an option number");
  }

  return await fetchDropPollOptionVotersV2({
    dropId: dropId.trim(),
    optionNo,
    page: pageParam,
    pageSize,
    signal,
  });
};

export function useDropPollOptionVoters({
  dropId,
  optionNo,
  enabled = true,
  pageSize = DROP_POLL_OPTION_VOTERS_PAGE_SIZE,
}: UseDropPollOptionVotersProps) {
  const normalizedDropId = dropId.trim();
  const canFetch =
    enabled && normalizedDropId.length > 0 && typeof optionNo === "number";

  const queryKey = useMemo(
    () =>
      getDropPollOptionVotersQueryKey({
        dropId: normalizedDropId,
        optionNo,
        pageSize,
      }),
    [normalizedDropId, optionNo, pageSize]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal?: AbortSignal | undefined;
    }) =>
      fetchDropPollOptionVotersPage({
        dropId: normalizedDropId,
        optionNo,
        pageParam,
        pageSize,
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextDropPollOptionVotersPageParam,
    placeholderData: keepPreviousData,
    enabled: canFetch,
    staleTime: DROP_POLL_OPTION_VOTERS_STALE_TIME_MS,
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
