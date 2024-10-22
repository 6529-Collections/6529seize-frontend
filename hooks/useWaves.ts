import { useInfiniteQuery } from "@tanstack/react-query";

import { useContext, useEffect, useState } from "react";

import { useDebounce } from "react-use";
import { AuthContext } from "../components/auth/Auth";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";

export interface SearchWavesParams {
  readonly author?: string;
  readonly name?: string;
  readonly limit: number;
  readonly serial_no_less_than?: number;
  readonly group_id?: string;
}

interface UseWavesParams {
  readonly identity: string | null;
  readonly waveName: string | null;
  readonly limit?: number;
  readonly refetchInterval?: number;
}

export function useWaves({
  identity,
  waveName,
  limit = 20,
  refetchInterval,
}: UseWavesParams) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getUsePublicWaves = () =>
    !connectedProfile?.profile?.handle || !!activeProfileProxy;
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

  const [debouncedParams, setDebouncedParams] = useState<SearchWavesParams>(params);
  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const authQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      queryParams.limit = `${limit}`;
      
      if (pageParam) {
        queryParams.serial_no_less_than = `${pageParam}`;
      }
      if (debouncedParams.author) {
        queryParams.author = debouncedParams.author;
      }
      if (debouncedParams.name) {
        queryParams.name = debouncedParams.name;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: !usePublicWaves,
    refetchInterval: refetchInterval ?? false,
  });

  const publicQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_PUBLIC, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      if (pageParam) {
        queryParams.serial_no_less_than = `${pageParam}`;
      }
      if (debouncedParams.author) {
        queryParams.author = debouncedParams.author;
      }
      if (debouncedParams.name) {
        queryParams.name = debouncedParams.name;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-public`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: usePublicWaves,
    refetchInterval: refetchInterval ?? false,
  });

  const getWaves = (): ApiWave[] => {
    if (usePublicWaves) {
      return publicQuery.data?.pages.flat() ?? [];
    }
    return authQuery.data?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(() => setWaves(getWaves()), [authQuery.data, publicQuery.data, usePublicWaves]);

  const activeQuery = usePublicWaves ? publicQuery : authQuery;

  return {
    waves,
    isFetching: activeQuery.isFetching,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    hasNextPage: activeQuery.hasNextPage,
    fetchNextPage: activeQuery.fetchNextPage,
    status: activeQuery.status,
  };
}
