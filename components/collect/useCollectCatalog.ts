"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
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
  intent: CollectIntent
) {
  const listingMode = intent === "lowest";
  const family = Object.values(ApiCollectFamily).find(
    (value) => value.toString() === collection
  );
  const enabled = listingMode && family !== undefined;
  const listings = useInfiniteQuery({
    queryKey: [QueryKey.MARKET_LISTINGS, collection],
    initialPageParam: null as string | null,
    enabled,
    queryFn: ({ pageParam, signal }) =>
      fetchMarketListings(family ?? ApiCollectFamily.Memes, pageParam, signal),
    getNextPageParam: (page) => page.next,
  });
  const entries: CollectCatalogEntry[] = enabled
    ? (listings.data?.pages.flatMap((page) => page.entries) ?? [])
    : [];
  return {
    entries,
    pending: enabled && listings.isPending,
    failed: enabled && listings.isError,
    hasMore: enabled && listings.hasNextPage,
    loadingMore: enabled && listings.isFetchingNextPage,
    retry: () => {
      if (enabled) void listings.refetch();
    },
    loadMore: () => {
      if (enabled && listings.hasNextPage) void listings.fetchNextPage();
    },
  };
}
