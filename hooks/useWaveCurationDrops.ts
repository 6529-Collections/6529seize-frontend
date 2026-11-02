"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
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
import type { InfinitePageAdapter } from "@/components/react-query-wrapper/utils/refreshInfiniteQueryHead";
import type { ApiCurationDrop } from "@/generated/models/ApiCurationDrop";
import type { ApiCurationDropsPage } from "@/generated/models/ApiCurationDropsPage";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useDebouncedQueryRefetch } from "./useDebouncedQueryRefetch";
import { useInfiniteHeadRefetch } from "./useInfiniteHeadRefetch";
import { useWaveDropUpdateRefetch } from "./useWaveDropUpdateRefetch";

const DEFAULT_WAVE_CURATION_DROPS_PAGE_SIZE = 20;

const curationDropsPageAdapter: InfinitePageAdapter<
  ApiCurationDropsPage,
  ApiCurationDrop
> = {
  getItems: (page) => page.data,
  withItems: (page, data) => ({ ...page, data }),
  getKey: (drop) => drop.id,
};

export function useWaveCurationDrops({
  wave,
  curationId,
  pageSize = DEFAULT_WAVE_CURATION_DROPS_PAGE_SIZE,
  initialPage = 1,
  enabled = true,
}: {
  readonly wave: ApiWave | null;
  readonly curationId: string | null | undefined;
  readonly pageSize?: number | undefined;
  readonly initialPage?: number | undefined;
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
          initialPage,
          context: "wave-curation-drops",
        },
      ] as const,
    [normalizedCurationId, pageSize, waveId, initialPage]
  );

  const {
    data,
    dataUpdatedAt,
    error,
    fetchNextPage: onFetchNextPage,
    fetchPreviousPage,
    hasPreviousPage,
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
    initialPageParam: initialPage,
    getPreviousPageParam: (firstPage) =>
      firstPage.page > 1 ? firstPage.page - 1 : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetching) {
      await onFetchNextPage();
    }
  }, [hasNextPage, isFetching, onFetchNextPage]);

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

  const refetchHead = useInfiniteHeadRefetch({
    queryKey,
    refetch,
    strategy: "aligned",
    adapter: curationDropsPageAdapter,
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

        updateDropInCachedDrops(queryClient, message, {
          preferExistingPollVote: true,
        });
        requestRefetch();
      },
      [queryClient, requestRefetch, waveId]
    )
  );

  return {
    startIndex: ((data?.pages[0]?.page ?? initialPage) - 1) * pageSize,
    fetchPreviousPage,
    hasPreviousPage,
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
