"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiMarketListings } from "@/generated/models/ApiMarketListings";
import type { ApiCollectTdhListing } from "@/generated/models/ApiCollectTdhListing";
import type { ApiCollectTdhListings } from "@/generated/models/ApiCollectTdhListings";
import { fetchMarketListings } from "@/services/api/market-api";
import { fetchCollectTdhListings } from "@/services/api/collect-api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { CollectCollection, CollectIntent } from "./collect.types";

export interface CollectCatalogEntry {
  readonly asset: ApiCollectAsset;
  readonly order?: ApiMarketTradeOrder;
  readonly tdh?: ApiCollectTdhListing;
}
export function collectCatalogEntryId(entry: CollectCatalogEntry): string {
  return entry.order?.identity.order_hash ?? entry.asset.asset_key;
}
export function useCollectCatalog(
  collection: CollectCollection,
  intent: CollectIntent
) {
  const listingMode = intent === "lowest" || intent === "tdh";
  const queryClient = useQueryClient();
  const family = Object.values(ApiCollectFamily).find(
    (value) => value.toString() === collection
  );
  const enabled = listingMode && family !== undefined;
  const queryKey =
    intent === "tdh"
      ? [QueryKey.MARKET_LISTINGS, collection, "base-tdh"]
      : [QueryKey.MARKET_LISTINGS, collection];
  const listings = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    enabled,
    queryFn: ({
      pageParam,
      signal,
    }): Promise<ApiMarketListings | ApiCollectTdhListings> =>
      intent === "tdh"
        ? fetchCollectTdhListings(
            family ?? ApiCollectFamily.Memes,
            pageParam,
            signal
          )
        : fetchMarketListings(
            family ?? ApiCollectFamily.Memes,
            pageParam,
            signal
          ),
    getNextPageParam: (page) => page.next,
  });
  const entries: CollectCatalogEntry[] = enabled
    ? (listings.data?.pages.flatMap((page) =>
        page.entries.map((entry) => ({
          asset: entry.asset,
          order: entry.order,
          ...("rate_hundredths" in entry ? { tdh: entry } : {}),
        }))
      ) ?? [])
    : [];
  const firstPage = enabled ? listings.data?.pages[0] : undefined;
  return {
    entries,
    tdhSnapshot:
      firstPage && "snapshot_id" in firstPage ? firstPage : undefined,
    pending: enabled && listings.isPending,
    failed: enabled && listings.isError,
    hasMore: enabled && listings.hasNextPage,
    loadingMore: enabled && listings.isFetchingNextPage,
    retry: () => {
      if (!enabled) return;
      if (intent === "tdh")
        void queryClient.resetQueries({ queryKey, exact: true });
      else void listings.refetch();
    },
    loadMore: () => {
      if (enabled && listings.hasNextPage) void listings.fetchNextPage();
    },
  };
}
