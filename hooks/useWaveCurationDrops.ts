"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import {
  generateUniqueKeys,
  mapToExtendedDrops,
} from "@/helpers/waves/wave-drops.helpers";
import { fetchWaveCurationDropsV2 } from "@/services/api/wave-curation-drops-v2-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";

const DEFAULT_WAVE_CURATION_DROPS_PAGE_SIZE = 20;

export function useWaveCurationDrops({
  wave,
  curationId,
  pageSize = DEFAULT_WAVE_CURATION_DROPS_PAGE_SIZE,
  enabled = true,
}: {
  readonly wave: ApiWave | null;
  readonly curationId: string | null | undefined;
  readonly pageSize?: number | undefined;
  readonly enabled?: boolean | undefined;
}) {
  const normalizedCurationId = curationId?.trim() ?? "";
  const waveId = wave?.id ?? null;
  const queryClient = useQueryClient();
  const waveMin = useMemo(() => (wave ? toApiWaveMin(wave) : null), [wave]);
  const queryKey = useMemo(
    () =>
      [
        QueryKey.DROPS,
        {
          waveId,
          curationId: normalizedCurationId || null,
          pageSize,
          context: "wave-curation-drops",
        },
      ] as const,
    [normalizedCurationId, pageSize, waveId]
  );

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
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!wave || !normalizedCurationId) {
        throw new Error(
          "Wave and curation are required to load curation drops"
        );
      }

      return await fetchWaveCurationDropsV2({
        wave,
        curationId: normalizedCurationId,
        page: pageParam,
        pageSize,
      });
    },
    enabled: enabled && !!waveId && normalizedCurationId.length > 0,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
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

  const drops = useMemo<ExtendedDrop[]>(() => {
    if (!waveMin) {
      return [];
    }

    const pages =
      data?.pages.map((page) => ({
        wave: waveMin,
        drops: page.data as ApiDropWithoutWave[],
      })) ?? [];

    return generateUniqueKeys(mapToExtendedDrops(pages, [], false), []);
  }, [data?.pages, waveMin]);

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
