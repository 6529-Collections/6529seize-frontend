"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DROPS_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { ApiWaveDropsFeed } from "../generated/models/ApiWaveDropsFeed";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "../helpers/waves/wave-drops.helpers";

import { commonApiFetch } from "../services/api/common-api";
import { ExtendedDrop } from "../helpers/waves/drop.helpers";

import { WsMessageType, WsDropUpdateMessage } from "../helpers/Types";
import { useWebSocketMessage } from "../services/websocket/useWebSocketMessage";
import { WaveDropsSearchStrategy } from "../contexts/wave/hooks/types";

export function useDropMessages(waveId: string, dropId: string | null) {
  const { isCapacitor } = useCapacitor();
  const [init, setInit] = useState(false);

  const queryKey = [
    QueryKey.DROPS,
    {
      waveId,
      limit: WAVE_DROPS_PARAMS.limit,
      dropId,
    },
  ];

  const {
    data,
    fetchNextPage: onFetchNextPage,
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
        drop_id: dropId ?? "",
      };

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
    enabled: !!dropId,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.drops.at(-1)?.serial_no
        ? {
            serialNo: lastPage.drops.at(-1)?.serial_no ?? null,
            strategy: WaveDropsSearchStrategy.FIND_OLDER,
          }
        : null,
    placeholderData: keepPreviousData,
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
    processDrops(data?.pages, [], false)
  );

  useEffect(() => {
    if (!data) return;
    setDrops((prev) => processDrops(data?.pages, prev, false));
    setInit(true);
  }, [data]);

  const lastRefetchTimeRef = useRef<number>(0);
  const pendingRefetchRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onRefetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
    const minDebounceTime = 1000; // 1 second debounce

    // Function to execute the actual refetch
    const executeRefetch = () => {
      lastRefetchTimeRef.current = Date.now();
      pendingRefetchRef.current = false;
      refetch();
    };

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If already fetching, set pending flag to refetch when done
    if (isFetching || isFetchingNextPage) {
      pendingRefetchRef.current = true;
      return;
    }

    // If debounce time hasn't passed, wait
    if (timeSinceLastRefetch < minDebounceTime) {
      if (!pendingRefetchRef.current) {
        pendingRefetchRef.current = true;
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          // When timeout completes, check if we're still fetching
          if (isFetching || isFetchingNextPage) {
            // Keep the pending flag true, it will be picked up by the effect
            return;
          }
          executeRefetch();
        }, minDebounceTime - timeSinceLastRefetch);
      }
      return;
    }

    // If we get here, execute immediately
    executeRefetch();
  }, [refetch, isFetching, isFetchingNextPage, waveId]);

  // Effect to check if we need to refetch after a fetch operation completes
  useEffect(() => {
    // Only run when fetching completes and there's a pending refetch
    if (!isFetching && !isFetchingNextPage && pendingRefetchRef.current) {
      const now = Date.now();
      const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
      const minDebounceTime = 1000; // 1 second debounce

      // If enough time has passed since last refetch, execute immediately
      if (timeSinceLastRefetch >= minDebounceTime) {
        lastRefetchTimeRef.current = now;
        pendingRefetchRef.current = false;
        refetch();
      } else {
        // Otherwise wait for the remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          if (pendingRefetchRef.current) {
            lastRefetchTimeRef.current = Date.now();
            pendingRefetchRef.current = false;
            refetch();
          }
        }, minDebounceTime - timeSinceLastRefetch);
      }
    }

    // Cleanup function to clear any timeouts when component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isFetching, isFetchingNextPage, refetch]);

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        // Skip if no dropId
        if (!dropId) return;

        if (waveId !== message.wave.id) {
          return;
        }

        onRefetch();
      },
      [waveId, dropId, onRefetch]
    )
  );

  const manualFetch = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetching ?? !init,
    isFetchingNextPage,
    refetch,
    manualFetch,
  };
}
