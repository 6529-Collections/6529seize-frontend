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

export enum WaveDropsLeaderboardSortBy {
  RANK = "RANK",
  CREATION_TIME = "CREATION_TIME",
}

export enum WaveDropsLeaderboardSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

interface UseWaveDropsLeaderboardProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly reverse: boolean;
  readonly dropsSortBy: WaveDropsLeaderboardSortBy;
  readonly sortDirection: WaveDropsLeaderboardSortDirection;
  readonly handle?: string;
  readonly pollingEnabled?: boolean;
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
  reverse,
  dropsSortBy,
  sortDirection,
  handle,
  pollingEnabled = true,
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
      sort: dropsSortBy,
      sort_direction: sortDirection,
      handle,
    },
  ];

  useEffect(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          page_size: WAVE_DROPS_PARAMS.limit.toString(),
          sort: dropsSortBy,
          sort_direction: sortDirection,
        };

        if (pageParam) {
          params.page = `${pageParam}`;
        }

        if (handle) {
          params.author_identity = handle;
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
  }, [waveId, dropsSortBy]);

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
        sort: dropsSortBy,
        sort_direction: sortDirection,
      };

      if (pageParam) {
        params.page = `${pageParam}`;
      }

      if (handle) {
        params.author_identity = handle;
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
    enabled: !!connectedProfileHandle,
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
            reverse
          )
        : [];
      return generateUniqueKeys(newDrops, prev);
    });
    setHasInitialized(true);
  }, [data, reverse]);

  useDebounce(() => setCanPoll(true), 10000, [data]);

  const { data: pollingResult } = useQuery({
    queryKey: [...queryKey, "polling"],
    queryFn: async () => {
      const params: Record<string, string> = {
        page_size: "1",
        sort: dropsSortBy,
        sort_direction: sortDirection,
      };

      if (handle) {
        params.author_identity = handle;
      }

      return await commonApiFetch<ApiDropsLeaderboardPage>({
        endpoint: `waves/${waveId}/leaderboard`,
        params,
      });
    },
    enabled: !haveNewDrops && canPoll && pollingEnabled,
    refetchInterval:
      isTabVisible && pollingEnabled
        ? ACTIVE_POLLING_INTERVAL
        : INACTIVE_POLLING_INTERVAL,
    refetchOnWindowFocus: pollingEnabled,
    refetchOnMount: pollingEnabled,
    refetchOnReconnect: pollingEnabled,
    refetchIntervalInBackground: !isCapacitor && pollingEnabled,
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
