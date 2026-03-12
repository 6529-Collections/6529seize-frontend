"use client";

import { useCallback, useEffect, useState } from "react";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import useCapacitor from "./useCapacitor";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";

import { commonApiFetch } from "@/services/api/common-api";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { WaveDropsSearchStrategy } from "@/contexts/wave/hooks/types";

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
        params["serial_no_limit"] = `${pageParam.serialNo}`;
        params["search_strategy"] = `${pageParam.strategy}`;
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
            strategy: WaveDropsSearchStrategy.Older,
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

  const requestRefetch = useDebouncedQueryRefetch({
    refetch,
    isFetching,
    isFetchingNextPage,
  });

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        // Skip if no dropId
        if (!dropId) return;

        if (waveId !== message.wave.id) {
          return;
        }

        requestRefetch();
      },
      [dropId, requestRefetch, waveId]
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
