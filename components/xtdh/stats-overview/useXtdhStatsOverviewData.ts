import { useCallback, useContext, useMemo } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useXtdhOverviewStats } from "@/hooks/useXtdhOverview";
import { useXtdhStats } from "@/hooks/useXtdhStats";
import { deriveProfileIdentifier } from "@/components/xtdh/profile-utils";

import type { NetworkStats, UserSectionState } from "./types";
import { buildNetworkStats, buildUserSectionState } from "./data-builders";

type NetworkState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; stats: NetworkStats };

interface UseXtdhStatsOverviewDataOptions {
  readonly enabled?: boolean;
}

interface UseXtdhStatsOverviewDataResult {
  readonly networkState: NetworkState;
  readonly userState: UserSectionState;
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

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching: isNetworkFetching,
  } = useXtdhOverviewStats(enabled);

  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: refetchUserStats,
    isFetching: isUserFetching,
  } = useXtdhStats({ profile: profileKey, enabled });

  const handleRetry = useCallback(() => {
    void refetch();
    if (profileKey) {
      void refetchUserStats();
    }
  }, [profileKey, refetch, refetchUserStats]);

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

  const userState = useMemo(
    () =>
      buildUserSectionState({
        connectedProfile,
        profileKey,
        isLoading: isUserLoading,
        isError: isUserError,
        error: userError,
        data: userData,
      }),
    [
      connectedProfile,
      profileKey,
      isUserLoading,
      isUserError,
      userError,
      userData,
    ]
  );

  const showRefreshing =
    isNetworkFetching || (profileKey !== null && isUserFetching);

  return {
    networkState,
    userState,
    showRefreshing,
    handleRetry,
  };
}
