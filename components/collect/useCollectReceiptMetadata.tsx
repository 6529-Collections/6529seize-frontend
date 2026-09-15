"use client";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";
import { useQuery } from "@tanstack/react-query";
import CollectAssetMedia from "./CollectAssetMedia";
import { loadCollectPlanMetadata } from "./collect-plan-metadata";
import type { CollectReceiptArtwork } from "./collect-receipt.helpers";

/** Public artwork data can arrive after confirmation; it never delays the outcome. */
export function useCollectReceiptMetadata(
  artworks: readonly CollectReceiptArtwork[]
): readonly CollectReceiptArtwork[] {
  const missing = [
    ...new Set(
      artworks
        .filter(
          (artwork) =>
            artwork.media === undefined ||
            artwork.media === null ||
            !artwork.title
        )
        .map((artwork) => artwork.assetKey)
    ),
  ].sort((left, right) => {
    if (left < right) return -1;
    return left > right ? 1 : 0;
  });
  const query = useQuery({
    queryKey: [QueryKey.COLLECT_ASSETS, "receipt", missing],
    enabled: missing.length > 0,
    queryFn: async ({ signal }) => {
      const deadline = createFetchDeadline(
        signal,
        15_000,
        () => new Error("Receipt artwork metadata timed out")
      );
      try {
        return await deadline.run(() =>
          loadCollectPlanMetadata(missing, deadline.signal)
        );
      } finally {
        deadline.dispose();
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const recovered = new Map(
    query.data?.map((asset) => [asset.asset_key, asset])
  );
  return artworks.map((artwork) => {
    const asset = recovered.get(artwork.assetKey);
    return asset
      ? {
          ...artwork,
          title: asset.name,
          media: artwork.media ?? (
            <CollectAssetMedia src={asset.image_url} name={asset.name} />
          ),
        }
      : artwork;
  });
}
