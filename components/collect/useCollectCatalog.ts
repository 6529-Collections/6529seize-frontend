"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { fetchCollectAssets } from "@/services/api/collect-api";
import { fetchMarketListings } from "@/services/api/market-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { CollectCollection, CollectIntent } from "./collect.types";

export interface CollectCatalogEntry {
  readonly asset: ApiCollectAsset;
  readonly order?: ApiMarketTradeOrder;
}
export function collectCatalogEntryId(entry: CollectCatalogEntry): string {
  return entry.order?.identity.order_hash ?? entry.asset.asset_key;
}
export function useCollectCatalog(
  collection: CollectCollection,
  query: string,
  intent: CollectIntent
) {
  const listingMode = intent === "lowest";
  const family = Object.values(ApiCollectFamily).find(
    (value) => value.toString() === collection
  );
  const assets = useInfiniteQuery({
    queryKey: [QueryKey.COLLECT_ASSETS, collection, query],
    initialPageParam: 1,
    enabled: !listingMode,
    queryFn: ({ pageParam, signal }) =>
      fetchCollectAssets({
        ...(family !== undefined ? { family } : {}),
        query,
        page: pageParam,
        signal,
      }),
    getNextPageParam: (page) => (page.next ? page.page + 1 : undefined),
  });
  const listings = useInfiniteQuery({
    queryKey: [QueryKey.MARKET_LISTINGS, collection],
    initialPageParam: null as string | null,
    enabled: listingMode && family !== undefined,
    queryFn: ({ pageParam, signal }) =>
      fetchMarketListings(family ?? ApiCollectFamily.Memes, pageParam, signal),
    getNextPageParam: (page) => page.next,
  });
  const entries: CollectCatalogEntry[] = listingMode
    ? (listings.data?.pages.flatMap((page) => page.entries) ?? [])
    : (assets.data?.pages.flatMap((page) => page.data) ?? []).map((asset) => ({
        asset,
      }));
  const active = listingMode ? listings : assets;
  return {
    entries,
    pending: active.isPending && (!listingMode || family !== undefined),
    failed: active.isError,
    hasMore: active.hasNextPage,
    loadingMore: active.isFetchingNextPage,
    retry: () => {
      void active.refetch();
    },
    loadMore: () => {
      void active.fetchNextPage();
    },
  };
}
