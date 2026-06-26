"use client";

import { useCallback, useEffect, useState } from "react";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import useCapacitor from "./useCapacitor";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { upsertDropIntoMatchingDropsQueries } from "@/components/react-query-wrapper/utils/addDropsToDrops";
import {
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
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
  type ApiWaveDropsV2PageFeed,
} from "@/services/api/wave-drops-v2-api";

export function useDropMessages(
  waveId: string,
  dropId: string | null,
  wave?: ApiWave
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
        page: number;
      } | null;
    }) =>
      fetchDropRepliesV2({
        parentDropId: dropId ?? "",
        page: pageParam?.page ?? 1,
        pageSize: WAVE_DROPS_PARAMS.limit,
        wave,
      }),
    enabled: !!dropId,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.next ? { page: lastPage.page + 1 } : null,
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

        upsertDropIntoMatchingDropsQueries(queryClient, { drop: message });
        updateDropInCachedDrops(queryClient, message, {
          preferExistingPollVote: true,
        });
        requestRefetch();
      },
      [dropId, queryClient, requestRefetch, waveId]
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
