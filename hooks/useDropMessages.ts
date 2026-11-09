"use client";

import { useCallback, useEffect, useState } from "react";

import {
  keepPreviousData,
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import useCapacitor from "./useCapacitor";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { upsertDropIntoMatchingDropsQueries } from "@/components/react-query-wrapper/utils/addDropsToDrops";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import {
  fetchDropRepliesV2,
  fetchDropReplyWindowV2,
  type DropReplyWindow,
  type ApiWaveDropsV2PageFeed,
} from "@/services/api/wave-drops-v2-api";
import { useInfiniteHeadRefetch } from "./useInfiniteHeadRefetch";
import { useWaveDropUpdateRefetch } from "./useWaveDropUpdateRefetch";
import type { InfinitePageAdapter } from "@/components/react-query-wrapper/utils/refreshInfiniteQueryHead";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";

const LINKED_REPLY_PAGE_SIZE = 25;

type DropMessagesPage = ApiWaveDropsV2PageFeed | DropReplyWindow;
type DropMessagesPageParam =
  | { readonly page: number }
  | { readonly serialNo: number; readonly strategy: ApiDropSearchStrategy }
  | null;

const dropMessagesPageAdapter: InfinitePageAdapter<
  DropMessagesPage,
  ApiDropWithoutWave
> = {
  getItems: (page) => page.drops,
  withItems: (page, drops) => ({ ...page, drops }),
  getKey: (drop) => drop.id,
};

export function useDropMessages(
  waveId: string,
  dropId: string | null,
  wave?: ApiWave,
  replySerialNo?: number
) {
  const { isCapacitor } = useCapacitor();
  const queryClient = useQueryClient();
  const [init, setInit] = useState(false);

  const queryKey = [
    QueryKey.DROPS,
    {
      waveId,
      limit: WAVE_DROPS_PARAMS.limit,
      dropId,
      ...(replySerialNo === undefined ? {} : { replySerialNo }),
    },
  ];

  const {
    data,
    fetchNextPage: onFetchNextPage,
    hasNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isError,
    refetch,
  } = useInfiniteQuery<
    DropMessagesPage,
    Error,
    InfiniteData<DropMessagesPage, DropMessagesPageParam>,
    typeof queryKey,
    DropMessagesPageParam
  >({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      pageParam && "serialNo" in pageParam
        ? fetchDropReplyWindowV2({
            parentDropId: dropId ?? "",
            serialNo: pageParam.serialNo,
            strategy: pageParam.strategy,
            limit: LINKED_REPLY_PAGE_SIZE,
            signal,
          })
        : fetchDropRepliesV2({
            parentDropId: dropId ?? "",
            page: pageParam?.page ?? 1,
            pageSize: WAVE_DROPS_PARAMS.limit,
            wave,
            signal,
          }),
    enabled: !!dropId,
    initialPageParam:
      replySerialNo === undefined
        ? null
        : { serialNo: replySerialNo, strategy: ApiDropSearchStrategy.Both },
    getNextPageParam: (lastPage): DropMessagesPageParam => {
      if ("older" in lastPage) {
        return lastPage.older === null
          ? null
          : { serialNo: lastPage.older, strategy: ApiDropSearchStrategy.Older };
      }
      return lastPage.next ? { page: lastPage.page + 1 } : null;
    },
    getPreviousPageParam: (firstPage): DropMessagesPageParam =>
      "newer" in firstPage && firstPage.newer !== null
        ? { serialNo: firstPage.newer, strategy: ApiDropSearchStrategy.Newer }
        : null,
    placeholderData: replySerialNo === undefined ? keepPreviousData : undefined,
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
    pages: (ApiWaveDropsFeed | ApiWaveDropsV2PageFeed)[] | undefined,
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

  const refetchHead = useInfiniteHeadRefetch({
    queryKey,
    refetch,
    strategy: "aligned",
    adapter: dropMessagesPageAdapter,
  });
  const requestRefetch = useDebouncedQueryRefetch({
    refetch: replySerialNo === undefined ? refetchHead : refetch,
    isFetching,
    isFetchingNextPage,
  });

  useWaveDropUpdateRefetch({
    enabled: !!dropId,
    waveId,
    requestRefetch,
  });

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    useCallback(
      (message) => {
        // Skip if no dropId
        if (!dropId) {
          return;
        }

        if (waveId !== message.wave.id) {
          return;
        }

        upsertDropIntoMatchingDropsQueries(queryClient, { drop: message });
        updateDropInCachedDrops(queryClient, message, {
          preferExistingPollVote: true,
        });
        requestRefetch();
      },
      [dropId, queryClient, requestRefetch, waveId]
    )
  );

  const manualFetch = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  return {
    data,
    drops,
    fetchNextPage,
    hasNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetching: isFetching ?? !init,
    isFetchingNextPage,
    isError,
    refetch,
    manualFetch,
  };
}
