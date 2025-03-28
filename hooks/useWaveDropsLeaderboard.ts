import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

import { useCallback, useEffect, useState } from "react";
import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "../helpers/waves/wave-drops.helpers";
import { useDebounce } from "react-use";
import { WAVE_DROPS_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { ApiDropsLeaderboardPage } from "../generated/models/ApiDropsLeaderboardPage";
import useCapacitor from "./useCapacitor";



interface UseWaveDropsLeaderboardProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly pollingEnabled?: boolean;
  readonly enabled?: boolean;
}

const POLLING_DELAY = 3000;
const ACTIVE_POLLING_INTERVAL = 5000;
const INACTIVE_POLLING_INTERVAL = 30000;

function useTabVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
}

export function useWaveDropsLeaderboard({
  waveId,
  connectedProfileHandle,
  pollingEnabled = true,
  enabled = true,
}: UseWaveDropsLeaderboardProps) {
  const { isCapacitor } = useCapacitor();
  const queryClient = useQueryClient();

  const [drops, setDrops] = useState<ExtendedDrop[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [haveNewDrops, setHaveNewDrops] = useState(false);
  const [canPoll, setCanPoll] = useState(false);
  const [delayedPollingResult, setDelayedPollingResult] = useState<
    ApiDropsLeaderboardPage | undefined
  >(undefined);
  const isTabVisible = useTabVisibility();

  const queryKey = [
    QueryKey.DROPS_LEADERBOARD,
    {
      waveId,
      page_size: WAVE_DROPS_PARAMS.limit,
    },
  ];

  useEffect(() => {
    // Only prefetch if enabled
    if (!enabled) return;
    
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          page_size: WAVE_DROPS_PARAMS.limit.toString(),
        };

        if (pageParam) {
          params.page = `${pageParam}`;
        }

        return await commonApiFetch<ApiDropsLeaderboardPage>({
          endpoint: `waves/${waveId}/leaderboard`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.next ? lastPage.page + 1 : null,
      pages: 3,
      staleTime: 60000,
    });
  }, [waveId, enabled]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        page_size: WAVE_DROPS_PARAMS.limit.toString(),
      };

      if (pageParam) {
        params.page = `${pageParam}`;
      }

      const results = await commonApiFetch<ApiDropsLeaderboardPage>({
        endpoint: `waves/${waveId}/leaderboard`,
        params,
      });

      return results;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
    placeholderData: keepPreviousData,
    enabled: enabled && !!connectedProfileHandle,
    staleTime: 60000,
  });

  useEffect(() => {
    setDrops((prev) => {
      const newDrops = data?.pages
        ? mapToExtendedDrops(
            data.pages.map((page) => ({
              wave: page.wave,
              drops: page.drops,
            })),
            prev,
          )
        : [];
      return generateUniqueKeys(newDrops, prev);
    });
    setHasInitialized(true);
  }, [data]);

  useDebounce(() => setCanPoll(true), 10000, [data]);

  const { data: pollingResult } = useQuery({
    queryKey: [...queryKey, "polling"],
    queryFn: async () => {
      const params: Record<string, string> = {
        page_size: "1",
      };

      return await commonApiFetch<ApiDropsLeaderboardPage>({
        endpoint: `waves/${waveId}/leaderboard`,
        params,
      });
    },
    enabled: enabled && !haveNewDrops && canPoll && pollingEnabled,
    refetchInterval:
      isTabVisible && pollingEnabled && enabled
        ? ACTIVE_POLLING_INTERVAL
        : INACTIVE_POLLING_INTERVAL,
    refetchOnWindowFocus: pollingEnabled && enabled,
    refetchOnMount: pollingEnabled && enabled,
    refetchOnReconnect: pollingEnabled && enabled,
    refetchIntervalInBackground: !isCapacitor && pollingEnabled && enabled,
  });

  useEffect(() => {
    if (pollingResult) {
      const timer = setTimeout(() => {
        setDelayedPollingResult(pollingResult);
      }, POLLING_DELAY);

      return () => clearTimeout(timer);
    }
  }, [pollingResult]);

  useEffect(() => {
    if (delayedPollingResult !== undefined) {
      if (delayedPollingResult.drops.length > 0) {
        const latestPolledDrop = delayedPollingResult.drops[0];

        if (drops.length > 0) {
          const latestExistingDrop = drops.at(-1);

          const polledCreatedAt = new Date(
            latestPolledDrop.created_at
          ).getTime();
          const existingCreatedAt = new Date(
            latestExistingDrop?.created_at ?? 0
          ).getTime();

          setHaveNewDrops(polledCreatedAt > existingCreatedAt);
        } else {
          setHaveNewDrops(true);
        }
      } else {
        setHaveNewDrops(false);
      }
    }
  }, [delayedPollingResult, drops]);

  useEffect(() => {
    if (!haveNewDrops) return;
    if (!isTabVisible) return;
    const hasTempDrop = drops.some((drop) => drop.id.startsWith("temp-"));
    if (hasTempDrop) return;
    refetch();
    setHaveNewDrops(false);
  }, [haveNewDrops, isTabVisible, drops]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({
        queryKey: [QueryKey.DROPS, { waveId }],
      });
    };
  }, [waveId, queryClient]);

  const manualFetch = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetching || !hasInitialized,
    isFetchingNextPage,
    refetch,
    haveNewDrops,
    manualFetch,
  };
}
