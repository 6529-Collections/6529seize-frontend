"use client";

import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { TypedFeedItem } from "@/types/feed.types";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";

interface UseMyStreamQueryProps {
  readonly reverse: boolean;
}

export function useMyStreamQuery({ reverse }: UseMyStreamQueryProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<TypedFeedItem[]>([]);
  const [isInitialQueryDone, setIsInitialQueryDone] = useState(false);

  queryClient.prefetchInfiniteQuery({
    queryKey: [QueryKey.FEED_ITEMS],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {};
      if (pageParam) {
        params["serial_no_less_than"] = `${pageParam}`;
      }

      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    pages: 3,
    staleTime: 60000,
    ...getDefaultQueryRetry(),
  });

  const query = useInfiniteQuery({
    queryKey: [QueryKey.FEED_ITEMS],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {};
      if (pageParam) {
        params["serial_no_less_than"] = `${pageParam}`;
      }
      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    ...getDefaultQueryRetry(),
  });

  useEffect(() => {
    let data: TypedFeedItem[] = [];

    if (query.data?.pages.length) {
      data = query.data.pages.flat();
      if (reverse) {
        data = data.toReversed();
      }
    }

    setItems(data);
    setIsInitialQueryDone(true);
  }, [query.data, reverse]);

  return { ...query, items, isInitialQueryDone };
}

export function usePollingQuery(
  isInitialQueryDone: boolean,
  items: TypedFeedItem[],
  reverse: boolean
) {
  const { isCapacitor } = useCapacitor();
  const [haveNewItems, setHaveNewItems] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { data: pollingResult, refetch } = useQuery({
    queryKey: [QueryKey.FEED_ITEMS, { limit: 1 }],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "1" };
      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
      });
    },
    enabled: isInitialQueryDone, // Keep polling even when new items exist
    refetchInterval: isTabVisible ? 5000 : 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    ...getDefaultQueryRetry(),
  });

  useEffect(() => {
    if (isTabVisible) {
      refetch();
    }
  }, [isTabVisible, refetch]);

  useEffect(() => {
    if (pollingResult && pollingResult.length > 0 && items.length > 0) {
      const latestPolledItem = pollingResult[0];
      const latestExistingItem = reverse
        ? items.at(items.length - 1)
        : items.at(0);
      setHaveNewItems(
        latestExistingItem
          ? latestPolledItem?.serial_no! > latestExistingItem.serial_no
          : true
      );
    } else {
      // Don't show "new items" when feed hasn't loaded yet
      setHaveNewItems(false);
    }
  }, [pollingResult, items, reverse]);

  return { haveNewItems };
}
