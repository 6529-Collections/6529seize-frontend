import { useCallback, useEffect, useState } from "react";
import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import { ApiWaveDropsFeed } from "../generated/models/ApiWaveDropsFeed";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "../helpers/waves/wave-drops.helpers";
import { WAVE_DROPS_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { useWavePolling } from "./useWavePolling";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
export enum WaveDropsSearchStrategy {
  FIND_OLDER = "FIND_OLDER",
  FIND_NEWER = "FIND_NEWER",
  FIND_BOTH = "FIND_BOTH",
}

interface UseWaveDropsProps {
  readonly waveId: string;
  readonly connectedProfileHandle: string | undefined;
  readonly reverse: boolean;
  readonly dropId: string | null;
}

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

export function useWaveDrops({
  waveId,
  connectedProfileHandle,
  reverse,
  dropId,
}: UseWaveDropsProps) {
  const { isCapacitor } = useCapacitor();
  const queryClient = useQueryClient();
  const isTabVisible = useTabVisibility();

  const queryKey = [
    QueryKey.DROPS,
    {
      waveId,
      limit: WAVE_DROPS_PARAMS.limit,
      dropId,
    },
  ];

  useEffect(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_DROPS_PARAMS.limit.toString(),
        };
        if (dropId) {
          params.drop_id = dropId;
        }

        if (pageParam) {
          params.serial_no_less_than = `${pageParam}`;
        }

        return await commonApiFetch<ApiWaveDropsFeed>({
          endpoint: `waves/${waveId}/drops`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
      pages: 3,
      staleTime: 60000,
    });
  }, [waveId]);

  const {
    data,
    fetchNextPage: onFetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    error: mainQueryError,
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

      if (dropId) {
        params.drop_id = dropId;
      }
      if (pageParam?.serialNo) {
        params.serial_no_limit = `${pageParam.serialNo}`;
        params.search_strategy = `${pageParam.strategy}`;
      }

      const results = await commonApiFetch<ApiWaveDropsFeed>({
        endpoint: `waves/${waveId}/drops`,
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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
  });

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await onFetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  const processDrops = (
    pages: ApiWaveDropsFeed[] | undefined,
    previousDrops: ExtendedDrop[],
    isReverse: boolean
  ) => {
    const newDrops = pages
      ? mapToExtendedDrops(
          pages.map((page) => ({ wave: page.wave, drops: page.drops })),
          previousDrops,
          isReverse
        )
      : [];
    return generateUniqueKeys(newDrops, previousDrops);
  };

  const [drops, setDrops] = useState<ExtendedDrop[]>(() =>
    processDrops(data?.pages, [], reverse)
  );

  useEffect(() => {
    setDrops((prev) => processDrops(data?.pages, prev, reverse));
  }, [data, reverse]);

  const onRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const {
    hasNewDrops,
    error: pollingError,
    lastPolledData,
  } = useWavePolling(queryKey, waveId, dropId, drops, isTabVisible, onRefetch);

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
    haveNewDrops: hasNewDrops,
    manualFetch,
    error: mainQueryError || pollingError,
    lastPolledData,
  };
}
