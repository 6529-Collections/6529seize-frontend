import { useContext, useEffect, useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { AuthContext } from "../components/auth/Auth";
import { WavesOverviewParams } from "../types/waves.types";
import { ApiWavesOverviewType } from "../generated/models/ApiWavesOverviewType";
import { commonApiFetch } from "../services/api/common-api";
import { ApiWave } from "../generated/models/ApiWave";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface UseWavesOverviewProps {
  readonly type: ApiWavesOverviewType;
  readonly limit?: number;
  readonly following?: boolean;
  readonly refetchInterval?: number;
}

export const useWavesOverview = ({
  type,
  limit = 20,
  following = false,
  refetchInterval,
}: UseWavesOverviewProps) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getUsePublicWaves = () =>
    !connectedProfile?.profile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());

  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const params: Omit<WavesOverviewParams, "offset"> = {
    limit,
    type,
    only_waves_followed_by_authenticated_user: following,
  };

  const authQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
        only_waves_followed_by_authenticated_user: `${params.only_waves_followed_by_authenticated_user}`,
      };

      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) =>
      allPages.at(-1)?.length === params.limit ? allPages.flat().length : null,
    enabled: !usePublicWaves,
    placeholderData: keepPreviousData,
    refetchInterval: refetchInterval ?? false,
  });

  const publicQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW_PUBLIC, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
        only_waves_followed_by_authenticated_user: `${params.only_waves_followed_by_authenticated_user}`,
      };

      return await commonApiFetch<ApiWave[]>({
        endpoint: `public/waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) =>
      allPages.at(-1)?.length === params.limit ? allPages.flat().length : null,
    enabled: usePublicWaves,
    placeholderData: keepPreviousData,
    refetchInterval: refetchInterval ?? false,
  });

  const getWaves = (): ApiWave[] => {
    if (usePublicWaves) {
      return publicQuery.data?.pages.flat() ?? [];
    }
    return authQuery.data?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(() => {
    setWaves(getWaves());
  }, [authQuery.data, publicQuery.data, usePublicWaves]);

  const activeQuery = usePublicWaves ? publicQuery : authQuery;

  return {
    waves,
    isFetching: activeQuery.isFetching,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    hasNextPage: activeQuery.hasNextPage,
    fetchNextPage: activeQuery.fetchNextPage,
    status: activeQuery.status,
  };
};
