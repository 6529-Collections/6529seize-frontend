import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

import { useCallback, useEffect, useState } from "react";
import { Wave } from "../generated/models/Wave";
import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import { WaveDropsFeed } from "../generated/models/WaveDropsFeed";
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

export enum WaveDropsSearchStrategy {
  FIND_OLDER = "FIND_OLDER",
  FIND_NEWER = "FIND_NEWER",
  FIND_BOTH = "FIND_BOTH",
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

export function useWaveDrops(
  wave: Wave,
  connectedProfileHandle: string | undefined
) {
  const queryClient = useQueryClient();

  const [drops, setDrops] = useState<ExtendedDrop[]>([]);
  const [haveNewDrops, setHaveNewDrops] = useState(false);
  const [canPoll, setCanPoll] = useState(false);
  const [delayedPollingResult, setDelayedPollingResult] = useState<
    WaveDropsFeed | undefined
  >(undefined);
  const isTabVisible = useTabVisibility();


  const queryKey = [
    QueryKey.DROPS,
    {
      waveId: wave.id,
      limit: WAVE_DROPS_PARAMS.limit,
      dropId: null,
    },
  ];

  useEffect(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_DROPS_PARAMS.limit.toString(),
        };

        if (pageParam) {
          params.serial_no_less_than = `${pageParam}`;
        }
        return await commonApiFetch<WaveDropsFeed>({
          endpoint: `waves/${wave.id}/drops`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
      pages: 3,
      staleTime: 60000,
    });
  }, [wave])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({
      pageParam,
    }: {
      pageParam: {
        serialNo: number | null;
        strategy: WaveDropsSearchStrategy;
      } | null;
    }) => {
      const params: Record<string, string> = {
        limit: WAVE_DROPS_PARAMS.limit.toString(),
      };
      if (pageParam?.serialNo) {
        params.serial_no_limit = `${pageParam.serialNo}`;
        params.search_strategy = `${pageParam.strategy}`;
      }

      const results = await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${wave.id}/drops`,
        params,
      });

      return results;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.drops.at(-1)?.serial_no
        ? {
            serialNo: lastPage.drops.at(-1)?.serial_no ?? null,
            strategy: WaveDropsSearchStrategy.FIND_OLDER,
          }
        : null,
    placeholderData: keepPreviousData,
    enabled: !!connectedProfileHandle,
    staleTime: 60000,
  });

  useEffect(() => {
    setDrops((prev) => {
      const newDrops = data?.pages ? mapToExtendedDrops(data.pages, prev) : [];
      return generateUniqueKeys(newDrops, prev);
    });
  }, [data]);

  useDebounce(() => setCanPoll(true), 10000, [data]);

  const { data: pollingResult } = useQuery({
    queryKey: [...queryKey, "polling"],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
      };
      return await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${wave.id}/drops`,
        params,
      });
    },
    enabled: !haveNewDrops && canPoll,
    refetchInterval: isTabVisible
      ? ACTIVE_POLLING_INTERVAL
      : INACTIVE_POLLING_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
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
        queryKey: [QueryKey.DROPS, { waveId: wave.id }],
      });
    };
  }, [wave.id, queryClient]);

  const manualFetch = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    haveNewDrops,
    manualFetch,
  };
}
