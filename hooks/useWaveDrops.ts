"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { upsertDropIntoMatchingDropsQueries } from "@/components/react-query-wrapper/utils/addDropsToDrops";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  WsMessageType,
  type WsDropUpdateMessage,
} from "@/helpers/Types";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";
import { useInfiniteHeadRefetch } from "./useInfiniteHeadRefetch";
import { useWaveDropUpdateRefetch } from "./useWaveDropUpdateRefetch";
import { useAuth } from "@/components/auth/Auth";
import type { InfinitePageAdapter } from "@/components/react-query-wrapper/utils/refreshInfiniteQueryHead";

const DEFAULT_WAVE_DROPS_LIMIT = 20;
/**
 * A media-only page is filled by reading raw feed pages until one of them has
 * media. Bound that scan so a wave with little media cannot trigger an endless
 * request chain; the next page continues from where the scan stopped.
 */
const MAX_MEDIA_SCAN_REQUESTS = 10;

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

const waveDropsPageAdapter: InfinitePageAdapter<WaveDropsPage, ApiDrop> = {
  getItems: (page) => page.drops,
  withItems: (page, drops) => ({ ...page, drops }),
  getKey: (drop) => drop.id,
};

const fetchWaveDropsPage = async ({
  waveId,
  dropType,
  containsMedia,
  limit,
  pageParam,
  signal,
}: {
  readonly waveId: string;
  readonly dropType: ApiDropType | undefined;
  readonly containsMedia: boolean;
  readonly limit: number;
  readonly pageParam: number | null;
  readonly signal: AbortSignal;
}): Promise<WaveDropsPage> => {
  const collectedDrops: ApiDrop[] = [];
  let nextSerialNo: number | undefined;
  let serialNoLimit = pageParam;
  const maxRequests = containsMedia ? MAX_MEDIA_SCAN_REQUESTS : 1;

  for (let request = 0; request < maxRequests; request++) {
    signal.throwIfAborted();
    const feed = await fetchWaveDropsFeedV2({
      waveId,
      limit,
      serialNoLimit,
      searchStrategy:
        typeof serialNoLimit === "number"
          ? ApiDropSearchStrategy.Older
          : undefined,
      dropType,
      signal,
    });
    const pageDrops = feed.drops as ApiDrop[];

    if (pageDrops.length === 0) {
      return { drops: collectedDrops };
    }

    nextSerialNo = pageDrops.at(-1)?.serial_no;
    collectedDrops.push(
      ...(containsMedia ? pageDrops.filter(hasMedia) : pageDrops)
    );

    if (nextSerialNo === undefined || nextSerialNo === serialNoLimit) {
      // The feed made no progress, so there is nothing older to ask for.
      return { drops: collectedDrops };
    }
    if (collectedDrops.length > 0) {
      break;
    }

    serialNoLimit = nextSerialNo;
  }

  return { drops: collectedDrops, nextSerialNo };
};

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
  const { connectedProfile } = useAuth();
  const viewerProfileId = connectedProfile?.id ?? null;
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
          viewerProfileId,
        },
      ] as const,
    [waveId, limit, dropType, containsMedia, curationId, viewerProfileId]
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
    queryFn: ({
      pageParam,
      signal,
    }: {
      pageParam: number | null;
      signal: AbortSignal;
    }) =>
      fetchWaveDropsPage({
        waveId,
        dropType,
        containsMedia,
        limit,
        pageParam,
        signal,
      }),
    enabled: enabled && !!waveId,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextSerialNo,
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[1];
      if (
        typeof previousParams !== "object" ||
        !("viewerProfileId" in previousParams) ||
        previousParams.viewerProfileId !== viewerProfileId
      ) {
        return undefined;
      }
      return previousData;
    },
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
  const refetchHead = useInfiniteHeadRefetch({
    queryKey,
    refetch,
    strategy: "cursor",
    adapter: waveDropsPageAdapter,
  });
  const requestRefetch = useDebouncedQueryRefetch({
    refetch: refetchHead,
    isFetching,
    isFetchingNextPage,
  });

  useWaveDropUpdateRefetch({ enabled, waveId, requestRefetch });

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        if (waveId !== message.wave.id) {
          return;
        }

        upsertDropIntoMatchingDropsQueries(queryClient, { drop: message });
        updateDropInCachedDrops(queryClient, message, {
          preferExistingPollVote: true,
        });
        requestRefetch();
      },
      [queryClient, requestRefetch, waveId]
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
