"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { WavesOverviewParams } from "@/types/waves.types";
import type { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";

interface UseWavesOverviewProps {
  readonly type: ApiWavesOverviewType;
  readonly limit?: number | undefined;
  readonly following?: boolean | undefined;
  readonly viewerIdentityKey?: string | null | undefined;
  /**
   * If true, fetch only direct message waves. If false, exclude them. Undefined -> no filter.
   */
  readonly directMessage?: boolean | undefined;
  readonly refetchInterval?: number | undefined;
}

const ERROR_COOLDOWN_MS = 30000;
type TimeoutRef = {
  current: ReturnType<typeof setTimeout> | null;
};

export const useWavesOverview = ({
  type,
  limit = 20,
  following = false,
  viewerIdentityKey,
  directMessage,
  refetchInterval = Infinity,
}: UseWavesOverviewProps) => {
  const params: Omit<WavesOverviewParams, "offset"> = {
    limit,
    type,
    only_waves_followed_by_authenticated_user: following,
    ...(directMessage !== undefined ? { direct_message: directMessage } : {}),
  };
  const normalizedViewerIdentityKey =
    viewerIdentityKey?.trim().toLowerCase() ?? null;
  const queryKeyParams = useMemo(() => {
    if (!normalizedViewerIdentityKey) {
      return params;
    }

    return {
      ...params,
      viewer_identity: normalizedViewerIdentityKey,
    };
  }, [normalizedViewerIdentityKey, params]);

  const [lastErrorTimestamp, setLastErrorTimestamp] = useState<number | null>(
    null
  );
  const fetchNextPageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, queryKeyParams],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
        only_waves_followed_by_authenticated_user: `${params.only_waves_followed_by_authenticated_user}`,
      };

      if (params.direct_message !== undefined) {
        queryParams["direct_message"] = `${params.direct_message}`;
      }

      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) =>
      allPages.at(-1)?.length === params.limit ? allPages.flat().length : null,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey?.[1] as
        | { viewer_identity?: string | null }
        | undefined;
      const previousViewerIdentity =
        typeof previousParams?.viewer_identity === "string"
          ? previousParams.viewer_identity
          : null;

      if (previousViewerIdentity === normalizedViewerIdentityKey) {
        return previousData;
      }

      return undefined;
    },
    refetchInterval,
    ...getDefaultQueryRetry(() => setLastErrorTimestamp(Date.now())),
  });

  const getWaves = (): ApiWave[] => query.data?.pages.flat() ?? [];

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(() => {
    setWaves(getWaves());
  }, [query.data]);

  const getRemainingCooldown = useCallback(() => {
    if (lastErrorTimestamp === null) {
      return 0;
    }

    return Math.max(ERROR_COOLDOWN_MS - (Date.now() - lastErrorTimestamp), 0);
  }, [lastErrorTimestamp]);

  const clearScheduledAction = useCallback((timeoutRef: TimeoutRef) => {
    const timeoutId = timeoutRef.current;
    if (timeoutId === null) {
      return;
    }

    clearTimeout(timeoutId);
    timeoutRef.current = null;
  }, []);

  const runWithCooldown = useCallback(
    (timeoutRef: TimeoutRef, action: () => void) => {
      const remainingCooldown = getRemainingCooldown();
      if (remainingCooldown === 0) {
        action();
        return;
      }

      clearScheduledAction(timeoutRef);

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        action();
      }, remainingCooldown);
    },
    [clearScheduledAction, getRemainingCooldown]
  );

  useEffect(() => {
    return () => {
      clearScheduledAction(fetchNextPageTimeoutRef);
      clearScheduledAction(refetchTimeoutRef);
    };
  }, [clearScheduledAction]);

  const fetchNextPage = useCallback(() => {
    runWithCooldown(fetchNextPageTimeoutRef, () => {
      void query.fetchNextPage().catch(() => {
        // Error surfaced via query state
      });
    });
  }, [query, runWithCooldown]);

  const refetch = useCallback(() => {
    runWithCooldown(refetchTimeoutRef, () => {
      void query.refetch().catch(() => {
        // Error surfaced via query state
      });
    });
  }, [query, runWithCooldown]);

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
