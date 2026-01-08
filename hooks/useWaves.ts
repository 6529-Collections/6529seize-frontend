"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useContext, useEffect, useState } from "react";

import { useDebounce } from "react-use";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
interface SearchWavesParams {
  readonly author?: string | undefined;
  readonly name?: string | undefined;
  readonly limit: number;
  readonly serial_no_less_than?: number | undefined;
  readonly group_id?: string | undefined;
}

interface UseWavesParams {
  readonly identity: string | null;
  readonly waveName: string | null;
  readonly limit?: number | undefined;
  readonly refetchInterval?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export function useWaves({
  identity,
  waveName,
  limit = 20,
  refetchInterval = Infinity,
  enabled = true,
}: UseWavesParams) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getUsePublicWaves = () =>
    !connectedProfile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());
  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): SearchWavesParams => ({
    author: identity ?? undefined,
    name: waveName ?? undefined,
    limit,
  });

  const [params, setParams] = useState<SearchWavesParams>(getParams());
  useEffect(() => setParams(getParams()), [identity, waveName]);

  const [debouncedParams, setDebouncedParams] =
    useState<SearchWavesParams>(params);
  useDebounce(() => setDebouncedParams(params), 200, [params]); 

  const authQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      queryParams["limit"] = `${limit}`;

      if (pageParam) {
        queryParams["serial_no_less_than"] = `${pageParam}`;
      }
      if (debouncedParams.author) {
        queryParams["author"] = debouncedParams.author;
      }
      if (debouncedParams.name) {
        queryParams["name"] = debouncedParams.name;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: enabled && !usePublicWaves,
    refetchInterval,
    ...getDefaultQueryRetry(),
  });

  const publicQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_PUBLIC, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      if (pageParam) {
        queryParams["serial_no_less_than"] = `${pageParam}`;
      }
      if (debouncedParams.author) {
        queryParams["author"] = debouncedParams.author;
      }
      if (debouncedParams.name) {
        queryParams["name"] = debouncedParams.name;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-public`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: enabled && usePublicWaves,
    refetchInterval,
    ...getDefaultQueryRetry(),
  });

  const getWaves = (): ApiWave[] => {
    if (usePublicWaves) {
      return publicQuery.data?.pages.flat() ?? [];
    }
    return authQuery.data?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(() => {
    if (!enabled) {
      setWaves([]);
      return;
    }
    setWaves(getWaves());
  }, [enabled, authQuery.data, publicQuery.data, usePublicWaves]);

  const activeQuery = usePublicWaves ? publicQuery : authQuery;

  return {
    waves,
    isFetching: activeQuery.isFetching,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    hasNextPage: activeQuery.hasNextPage,
    fetchNextPage: activeQuery.fetchNextPage,
    status: activeQuery.status,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
  };
}
