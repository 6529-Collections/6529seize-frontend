import { useCallback, useContext, useMemo } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "@/components/auth/Auth";
import { deriveProfileIdentifier } from "@/components/xtdh/profile-utils";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useXtdhOverviewStats } from "@/hooks/useXtdhOverview";
import type { NetworkStats } from "./types";
import { buildNetworkStats } from "./data-builders";

type NetworkState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; stats: NetworkStats };

interface UseXtdhStatsOverviewDataOptions {
  readonly enabled?: boolean;
}

interface UseXtdhStatsOverviewDataResult {
  readonly networkState: NetworkState;
  readonly showRefreshing: boolean;
  readonly handleRetry: () => void;
}

const DEFAULT_ERROR_MESSAGE = "Unable to load xTDH data";

export function useXtdhStatsOverviewData({
  enabled = true,
}: Readonly<UseXtdhStatsOverviewDataOptions> = {}): UseXtdhStatsOverviewDataResult {
  const { connectedProfile } = useContext(AuthContext);
  const profileKey = useMemo(
    () => deriveProfileIdentifier(connectedProfile),
    [connectedProfile]
  );
  const normalizedIdentity = useMemo(
    () => profileKey?.toLowerCase(),
    [profileKey]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching: isNetworkFetching,
  } = useXtdhOverviewStats(enabled);

  const queryClient = useQueryClient();
  const userQueryKey = useMemo(
    () => [QueryKey.IDENTITY_TDH_STATS, normalizedIdentity],
    [normalizedIdentity]
  );

  const userFetching = useIsFetching({ queryKey: userQueryKey });

  const handleRetry = useCallback(() => {
    void refetch();
    if (profileKey) {
      void queryClient.invalidateQueries({ queryKey: userQueryKey });
    }
  }, [profileKey, queryClient, refetch, userQueryKey]);

  const networkStats = useMemo(
    () => (data ? buildNetworkStats(data) : null),
    [data]
  );

  const networkState: NetworkState = useMemo(() => {
    if (isLoading && !data) {
      return { kind: "loading" };
    }

    if (!networkStats || isError) {
      const message = error instanceof Error ? error.message : undefined;
      return { kind: "error", message: message ?? DEFAULT_ERROR_MESSAGE };
    }

    return { kind: "ready", stats: networkStats };
  }, [isLoading, data, networkStats, isError, error]);

  const showRefreshing =
    isNetworkFetching || userFetching > 0;

  return {
    networkState,
    showRefreshing,
    handleRetry,
  };
}
