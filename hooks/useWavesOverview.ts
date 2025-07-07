"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { WavesOverviewParams } from "../types/waves.types";
import { ApiWavesOverviewType } from "../generated/models/ApiWavesOverviewType";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "../components/react-query-wrapper/utils/query-utils";

interface UseWavesOverviewProps {
  readonly type: ApiWavesOverviewType;
  readonly limit?: number;
  readonly following?: boolean;
  /**
   * If true, fetch only direct message waves. If false, exclude them. Undefined -> no filter.
   */
  readonly directMessage?: boolean;
  readonly refetchInterval?: number;
}

export const useWavesOverview = ({
  type,
  limit = 20,
  following = false,
  directMessage,
  refetchInterval = Infinity,
}: UseWavesOverviewProps) => {
  const params: Omit<WavesOverviewParams, "offset"> = {
    limit,
    type,
    only_waves_followed_by_authenticated_user: following,
    ...(directMessage !== undefined ? { direct_message: directMessage } : {}),
  };

  const [lastErrorTimestamp, setLastErrorTimestamp] = useState<number | null>(
    null
  );

  const query = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
        only_waves_followed_by_authenticated_user: `${params.only_waves_followed_by_authenticated_user}`,
      };

      if (params.direct_message !== undefined) {
        queryParams.direct_message = `${params.direct_message}`;
      }

      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) =>
      allPages.at(-1)?.length === params.limit ? allPages.flat().length : null,
    placeholderData: keepPreviousData,
    refetchInterval,
    ...getDefaultQueryRetry(() => setLastErrorTimestamp(Date.now())),
  });

  const getWaves = (): ApiWave[] => query.data?.pages.flat() ?? [];

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(() => {
    setWaves(getWaves());
  }, [query.data]);

  const fetchNextPage = useCallback(() => {
    if (lastErrorTimestamp && Date.now() - lastErrorTimestamp < 30000) {
      setTimeout(() => {
        query.fetchNextPage();
      }, 30000);
      return;
    }
    query.fetchNextPage();
  }, [lastErrorTimestamp, query]);

  const refetch = useCallback(() => {
    if (lastErrorTimestamp && Date.now() - lastErrorTimestamp < 30000) {
      setTimeout(() => {
        query.refetch();
      }, 30000);
      return;
    }
    query.refetch();
  }, [lastErrorTimestamp, query]);

  const returnValue = useMemo(() => {
    return {
      waves,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      fetchNextPage,
      status: query.status,
      refetch,
    };
  }, [waves, query, fetchNextPage, refetch]);

  return returnValue;
};
