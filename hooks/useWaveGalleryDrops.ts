"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";

const GALLERY_DROPS_LIMIT = 20;

const processDrops = (pages: ApiDrop[][] | undefined) => {
  if (!pages) return [];
  // Flatten all pages into single array and convert to ExtendedDrop
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

export function useWaveGalleryDrops(waveId: string) {
  const queryKey = [
    QueryKey.DROPS,
    {
      waveId,
      limit: GALLERY_DROPS_LIMIT,
      containsMedia: true,
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
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        wave_id: waveId,
        limit: GALLERY_DROPS_LIMIT.toString(),
        contains_media: "true",
      };

      if (typeof pageParam === "number") {
        params["serial_no_less_than"] = `${pageParam}`;
      }

      return await commonApiFetch<ApiDrop[]>({
        endpoint: "drops",
        params,
      });
    },
    enabled: !!waveId,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
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

  const drops = useMemo(() => processDrops(data?.pages), [data]);

  const lastRefetchTimeRef = useRef<number>(0);
  const pendingRefetchRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(isFetching);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    isFetchingRef.current = isFetching;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetching, isFetchingNextPage]);

  const onRefetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
    const minDebounceTime = 1000;

    const executeRefetch = () => {
      lastRefetchTimeRef.current = Date.now();
      pendingRefetchRef.current = false;
      void refetch().catch(() => {
        // Error surfaced via query state
      });
    };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isFetching || isFetchingNextPage) {
      pendingRefetchRef.current = true;
      return;
    }

    if (timeSinceLastRefetch < minDebounceTime) {
      pendingRefetchRef.current = true;
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (isFetchingRef.current || isFetchingNextPageRef.current) {
          return;
        }
        executeRefetch();
      }, minDebounceTime - timeSinceLastRefetch);
      return;
    }

    executeRefetch();
  }, [refetch, isFetching, isFetchingNextPage]);

  useEffect(() => {
    if (!isFetching && !isFetchingNextPage && pendingRefetchRef.current) {
      const now = Date.now();
      const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
      const minDebounceTime = 1000;

      if (timeSinceLastRefetch >= minDebounceTime) {
        lastRefetchTimeRef.current = now;
        pendingRefetchRef.current = false;
        void refetch().catch(() => {
          // Error surfaced via query state
        });
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          if (pendingRefetchRef.current) {
            lastRefetchTimeRef.current = Date.now();
            pendingRefetchRef.current = false;
            void refetch().catch(() => {
              // Error surfaced via query state
            });
          }
        }, minDebounceTime - timeSinceLastRefetch);
      }
    }

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
        if (waveId !== message.wave.id) {
          return;
        }
        onRefetch();
      },
      [waveId, onRefetch]
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
