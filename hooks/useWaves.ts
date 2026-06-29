"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useContext, useMemo, useState } from "react";

import { useDebounce } from "react-use";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
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
  readonly direct_message?: boolean | undefined;
}

interface UseWavesParams {
  readonly identity: string | null;
  readonly waveName: string | null;
  readonly limit?: number | undefined;
  readonly refetchInterval?: number | undefined;
  readonly enabled?: boolean | undefined;
  readonly directMessage?: boolean | undefined;
}

const noopAsyncWaveAction = async () => undefined;

export function useWaves({
  identity,
  waveName,
  limit = 20,
  refetchInterval = Infinity,
  enabled = true,
  directMessage,
}: UseWavesParams) {
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    isAuthenticated,
  } = useContext(AuthContext);
  const { address, hasValidWalletAuth } = useSeizeConnectContext();

  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile =
    hasValidWalletAuthorization &&
    (isAuthenticated ?? !!connectedProfile?.handle);
  const isPendingAuthSwitch = Boolean(
    address && (!hasValidWalletAuthorization || fetchingProfile)
  );
  const usePublicWaves =
    !connectedProfile?.handle ||
    !!activeProfileProxy ||
    !hasAuthenticatedProfile;

  const params = useMemo<SearchWavesParams>(
    () => ({
      author: identity ?? undefined,
      name: waveName ?? undefined,
      limit,
      direct_message: directMessage,
    }),
    [identity, waveName, limit, directMessage]
  );

  const [debouncedParams, setDebouncedParams] =
    useState<SearchWavesParams>(params);
  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const authQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      queryParams["limit"] = `${limit}`;

      if (typeof pageParam === "number") {
        queryParams["serial_no_less_than"] = `${pageParam}`;
      }
      if (debouncedParams.author) {
        queryParams["author"] = debouncedParams.author;
      }
      if (debouncedParams.name) {
        queryParams["name"] = debouncedParams.name;
      }
      if (debouncedParams.direct_message !== undefined) {
        queryParams["direct_message"] = `${debouncedParams.direct_message}`;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: enabled && !usePublicWaves && !isPendingAuthSwitch,
    refetchInterval,
    ...getDefaultQueryRetry(),
  });

  const publicQuery = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_PUBLIC, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const queryParams: Record<string, string> = {};
      queryParams["limit"] = `${limit}`;

      if (typeof pageParam === "number") {
        queryParams["serial_no_less_than"] = `${pageParam}`;
      }
      if (debouncedParams.author) {
        queryParams["author"] = debouncedParams.author;
      }
      if (debouncedParams.name) {
        queryParams["name"] = debouncedParams.name;
      }
      if (debouncedParams.direct_message !== undefined) {
        queryParams["direct_message"] = `${debouncedParams.direct_message}`;
      }
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves`,
        params: queryParams,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: enabled && usePublicWaves && !isPendingAuthSwitch,
    refetchInterval,
    ...getDefaultQueryRetry(),
  });

  const shouldMaskWaveData = !enabled || isPendingAuthSwitch;
  const waves = useMemo<ApiWave[]>(() => {
    if (shouldMaskWaveData) {
      return [];
    }
    if (usePublicWaves) {
      return publicQuery.data?.pages.flat() ?? [];
    }
    return authQuery.data?.pages.flat() ?? [];
  }, [authQuery.data, publicQuery.data, shouldMaskWaveData, usePublicWaves]);

  const activeQuery = usePublicWaves ? publicQuery : authQuery;
  const lastPageSize = shouldMaskWaveData
    ? 0
    : (activeQuery.data?.pages.at(-1)?.length ?? 0);

  return {
    waves,
    isFetching: shouldMaskWaveData ? false : activeQuery.isFetching,
    isFetchingNextPage: shouldMaskWaveData
      ? false
      : activeQuery.isFetchingNextPage,
    hasNextPage: shouldMaskWaveData ? false : activeQuery.hasNextPage,
    lastPageSize,
    fetchNextPage: shouldMaskWaveData
      ? noopAsyncWaveAction
      : activeQuery.fetchNextPage,
    status: shouldMaskWaveData ? "pending" : activeQuery.status,
    error: shouldMaskWaveData ? null : activeQuery.error,
    refetch: shouldMaskWaveData ? noopAsyncWaveAction : activeQuery.refetch,
  };
}
