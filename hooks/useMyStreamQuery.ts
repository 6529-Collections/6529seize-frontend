import { useState, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TypedFeedItem } from "../types/feed.types";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../services/api/common-api";

interface UseMyStreamQueryProps {
  readonly reverse: boolean;
}

export function useMyStreamQuery({ reverse }: UseMyStreamQueryProps) {
  const [items, setItems] = useState<TypedFeedItem[]>([]);
  const [isInitialQueryDone, setIsInitialQueryDone] = useState(false);

  const query = useInfiniteQuery({
    queryKey: [QueryKey.FEED_ITEMS],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {};
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
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
    enabled: !haveNewItems && isInitialQueryDone,
    refetchInterval: isTabVisible ? 5000 : 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (isTabVisible) {
      refetch();
    }
  }, [isTabVisible, refetch]);

  useEffect(() => {
    if (pollingResult && pollingResult.length > 0 && items.length > 0) {
      const latestPolledItem = pollingResult[0];
      const latestExistingItem = items[0];
      setHaveNewItems(
        latestPolledItem.serial_no > latestExistingItem.serial_no
      );
    } else if (
      pollingResult &&
      pollingResult.length > 0 &&
      items.length === 0
    ) {
      setHaveNewItems(true);
    } else {
      setHaveNewItems(false);
    }
  }, [pollingResult, items]);

  return { haveNewItems };
}
