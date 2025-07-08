"use client";

import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWaveVotersPage } from "../generated/models/ApiWaveVotersPage";
import { ApiWaveVoter } from "../generated/models/ApiWaveVoter";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "../components/react-query-wrapper/utils/query-utils";

interface UseWaveTopVotersProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly reverse: boolean;
  readonly dropId: string | null;
  readonly sortDirection?: "ASC" | "DESC";
  readonly sort?: "ABSOLUTE" | "POSITIVE" | "NEGATIVE";
  readonly refetchInterval?: number;
}

export function useWaveTopVoters({
  waveId,
  connectedProfileHandle,
  reverse,
  dropId,
  sortDirection = "ASC",
  sort = "ABSOLUTE",
  refetchInterval = Infinity,
}: UseWaveTopVotersProps) {
  const queryClient = useQueryClient();
  const [voters, setVoters] = useState<ApiWaveVoter[]>([]);

  const queryKey = [
    QueryKey.WAVE_VOTERS,
    {
      waveId,
      dropId,
      sortDirection,
      sort,
    },
  ];

  useEffect(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          page_size: "20",
          sort_direction: sortDirection,
          sort: sort,
        };
        if (dropId) {
          params.drop_id = dropId;
        }
        if (pageParam !== null) {
          params.page = pageParam.toString();
        }
        return await commonApiFetch<ApiWaveVotersPage>({
          endpoint: `waves/${waveId}/voters`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.next ? allPages.length + 1 : null,
      pages: 3,
      staleTime: 60000,
      ...getDefaultQueryRetry(),
    });
  }, [waveId, dropId, sortDirection, sort]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        page_size: "20",
        sort_direction: sortDirection,
        sort: sort,
      };
      if (dropId) {
        params.drop_id = dropId;
      }
      if (pageParam !== null) {
        params.page = pageParam.toString();
      }

      return await commonApiFetch<ApiWaveVotersPage>({
        endpoint: `waves/${waveId}/voters`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : null,
    placeholderData: keepPreviousData,
    enabled: !!connectedProfileHandle,
    staleTime: 60000,
    refetchInterval,
    ...getDefaultQueryRetry(),
  });

  useEffect(() => {
    setVoters((prev) => {
      const newVoters = (data?.pages ? data.pages : []).flatMap(
        (page) => page.data
      );
      return reverse ? [...newVoters].reverse() : newVoters;
    });
  }, [data, reverse]);

  return {
    voters,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  };
}
