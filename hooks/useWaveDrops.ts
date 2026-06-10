"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";

const DEFAULT_WAVE_DROPS_LIMIT = 20;

interface UseWaveDropsProps {
  readonly waveId: string;
  readonly dropType?: ApiDropType | undefined;
  readonly containsMedia?: boolean | undefined;
  readonly curationId?: string | undefined;
  readonly limit?: number | undefined;
  readonly enabled?: boolean | undefined;
}

interface WaveDropsPage {
  readonly drops: ApiDrop[];
  readonly nextSerialNo?: number | undefined;
}

const hasMedia = (drop: ApiDrop): boolean =>
  drop.parts.some((part) => part.media.length > 0);

const processDrops = (pages: WaveDropsPage[] | undefined): ExtendedDrop[] => {
  if (!pages) {
    return [];
  }

  const allDrops = pages.flatMap((page) => page.drops);
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
  curationId,
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
          curationId: curationId ?? null,
          context: "wave-drops",
        },
      ] as const,
    [waveId, limit, dropType, containsMedia, curationId]
  );
  const queryClient = useQueryClient();

  const {
    data,
    dataUpdatedAt,
    error,
    fetchNextPage: onFetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const collectedDrops: ApiDrop[] = [];
      let nextSerialNo: number | undefined;
      let serialNoLimit = pageParam;

      for (let shouldFetch = true; shouldFetch; ) {
        const feed = await fetchWaveDropsFeedV2({
          waveId,
          limit,
          serialNoLimit,
          searchStrategy:
            typeof serialNoLimit === "number"
              ? ApiDropSearchStrategy.Older
              : undefined,
          dropType,
        });
        const pageDrops = feed.drops as ApiDrop[];

        if (pageDrops.length === 0) {
          return { drops: collectedDrops };
        }

        nextSerialNo = pageDrops.at(-1)?.serial_no;
        collectedDrops.push(
          ...(containsMedia ? pageDrops.filter(hasMedia) : pageDrops)
        );

        if (
          !containsMedia ||
          collectedDrops.length > 0 ||
          nextSerialNo === undefined ||
          nextSerialNo === serialNoLimit
        ) {
          shouldFetch = false;
          continue;
        }

        serialNoLimit = nextSerialNo;
      }

      return { drops: collectedDrops, nextSerialNo };
    },
    enabled: enabled && !!waveId,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextSerialNo,
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

        updateDropInCachedDrops(queryClient, message, {
          preferExistingPollVote: true,
        });
        requestRefetch();
      },
      [queryClient, requestRefetch, waveId]
    )
  );

  useWebSocketMessage<ApiAttachment>(
    WsMessageType.ATTACHMENT_STATUS_UPDATE,
    useCallback(
      (attachment) => {
        updateAttachmentInCachedDrops(queryClient, attachment);
      },
      [queryClient]
    )
  );

  return {
    dataUpdatedAt,
    drops,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    refetch,
  };
}
