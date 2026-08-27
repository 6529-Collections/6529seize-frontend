"use client";

import { useMemo } from "react";
import { useInfiniteQuery, type QueryStatus } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiProfileWaveActivityType } from "@/generated/models/ApiProfileWaveActivityType";
import {
  getHasAuthenticatedProfile,
  getViewerIdentityKey,
} from "@/hooks/useWavesList.helpers";
import { fetchProfileWaveActivityPage } from "@/services/api/waves-v2-api";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";

const PROFILE_WAVE_ACTIVITY_STALE_TIME_MS = 60_000;
const PUBLIC_VIEWER_CONTEXT = "public";

const noopAsyncAction = () => Promise.resolve();
const noopNextPageAction = () => Promise.resolve({ isComplete: false });

interface ProfileWaveActivityNextPageResult {
  readonly isComplete: boolean;
}

export interface ProfileWaveActivityQueryState {
  readonly waves: readonly ProfileWaveActivitySidebarItem[];
  readonly status: QueryStatus;
  readonly isInitialLoading: boolean;
  readonly isInitialError: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isFetchNextPageError: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => Promise<ProfileWaveActivityNextPageResult>;
  readonly refetch: () => Promise<unknown>;
}

export function useProfileWaveActivityWaves({
  identity,
  activityType,
  limit,
  enabled = true,
}: {
  readonly identity: string | null;
  readonly activityType: ApiProfileWaveActivityType;
  readonly limit: number;
  readonly enabled?: boolean | undefined;
}): ProfileWaveActivityQueryState {
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    isAuthenticated,
  } = useAuth();
  const { address, hasValidWalletAuth } = useSeizeConnectContext();
  const normalizedIdentity = identity?.trim().toLowerCase() ?? "";
  const hasValidWalletAuthorization = hasValidWalletAuth !== false;
  const hasAuthenticatedProfile = getHasAuthenticatedProfile({
    hasValidWalletAuthorization,
    isAuthenticated,
    hasConnectedProfile: Boolean(connectedProfile?.handle),
  });
  const isPendingAuthSwitch = Boolean(
    address && (!hasValidWalletAuthorization || fetchingProfile)
  );
  const viewerIdentityKey = getViewerIdentityKey({
    address,
    proxyId: activeProfileProxy?.id,
    hasValidWalletAuthorization,
    hasAuthenticatedProfile,
  });
  const viewerContext = viewerIdentityKey
    ? `${viewerIdentityKey}:profile:${connectedProfile?.handle?.toLowerCase() ?? "unknown"}`
    : PUBLIC_VIEWER_CONTEXT;
  const shouldMaskData = !enabled || isPendingAuthSwitch;
  const queryEnabled = !shouldMaskData && normalizedIdentity.length > 0;

  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.PROFILE_WAVE_ACTIVITY,
      {
        viewed_identity: normalizedIdentity,
        viewer_context: viewerContext,
        activity_type: activityType,
        limit,
      },
    ],
    queryFn: async ({ pageParam, signal }) =>
      await fetchProfileWaveActivityPage({
        identity: normalizedIdentity,
        activityType,
        limit,
        cursor: pageParam,
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: queryEnabled,
    staleTime: PROFILE_WAVE_ACTIVITY_STALE_TIME_MS,
    ...getDefaultQueryRetry(),
  });

  const waves = useMemo(
    () =>
      shouldMaskData
        ? []
        : (query.data?.pages.flatMap((page) => page.waves) ?? []),
    [query.data, shouldMaskData]
  );
  const status = shouldMaskData ? "pending" : query.status;

  return {
    waves,
    status,
    isInitialLoading: status === "pending" && waves.length === 0,
    isInitialError: status === "error" && waves.length === 0,
    isFetchingNextPage: shouldMaskData ? false : query.isFetchingNextPage,
    isFetchNextPageError: shouldMaskData ? false : query.isFetchNextPageError,
    hasNextPage: shouldMaskData ? false : Boolean(query.hasNextPage),
    fetchNextPage: shouldMaskData
      ? noopNextPageAction
      : async () => {
          const result = await query.fetchNextPage();
          return {
            isComplete: !result.isFetchNextPageError && !result.hasNextPage,
          };
        },
    refetch: shouldMaskData
      ? noopAsyncAction
      : async () => await query.refetch(),
  };
}
