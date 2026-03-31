"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";

const DEFAULT_WAVE_DROPS_LIMIT = 20;

interface UseWaveDropsProps {
  readonly waveId: string;
  readonly dropType?: ApiDropType | undefined;
  readonly containsMedia?: boolean | undefined;
  readonly limit?: number | undefined;
  readonly enabled?: boolean | undefined;
}

const processDrops = (pages: ApiDrop[][] | undefined): ExtendedDrop[] => {
  if (!pages) {
    return [];
  }

  const allDrops = pages.flat();
  const extendedDrops: ExtendedDrop[] = allDrops.map((drop) => ({
    ...drop,
    type: DropSize.FULL,
    stableKey: drop.id,
    stableHash: drop.id,
  }));

  const keyCount = new Map<string, number>();
  return extendedDrops.map((drop) => {
    const count = (keyCount.get(drop.stableKey) ?? 0) + 1;
    keyCount.set(drop.stableKey, count);

    if (count > 1) {
      return { ...drop, stableKey: `${drop.stableKey}-${count}` };
    }

    return drop;
  });
};

export function useWaveDrops({
  waveId,
  dropType,
  containsMedia = false,
  limit = DEFAULT_WAVE_DROPS_LIMIT,
  enabled = true,
}: UseWaveDropsProps) {
  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS,
        {
          waveId,
          limit,
          dropType: dropType ?? null,
          containsMedia,
          context: "wave-drops",
        },
      ] as const,
    [waveId, limit, dropType, containsMedia]
  );

  const {
    data,
    fetchNextPage: onFetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        wave_id: waveId,
        limit: limit.toString(),
      };

      if (containsMedia) {
        params["contains_media"] = "true";
      }

      if (dropType !== undefined) {
        params["drop_type"] = dropType;
      }

      if (typeof pageParam === "number") {
        params["serial_no_less_than"] = `${pageParam}`;
      }

      return await commonApiFetch<ApiDrop[]>({
        endpoint: "drops",
        params,
      });
    },
    enabled: enabled && !!waveId,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await onFetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  const drops = useMemo(() => processDrops(data?.pages), [data?.pages]);
  const requestRefetch = useDebouncedQueryRefetch({
    refetch,
    isFetching,
    isFetchingNextPage,
  });

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        if (waveId !== message.wave.id) {
          return;
        }

        requestRefetch();
      },
      [requestRefetch, waveId]
    )
  );

  return {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  };
}
