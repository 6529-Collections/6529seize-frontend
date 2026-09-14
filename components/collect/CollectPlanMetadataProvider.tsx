"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import {
  loadCollectPlanMetadata,
  matchingCollectAsset,
} from "./collect-plan-metadata";

const EMPTY_ASSETS = new Map<string, ApiCollectAsset>();
const MetadataContext = createContext<{
  assets: ReadonlyMap<string, ApiCollectAsset>;
  catalog: ApiCollectCatalog | undefined;
}>({ assets: EMPTY_ASSETS, catalog: undefined });

export const useCollectPlanMetadata = () => useContext(MetadataContext);

export default function CollectPlanMetadataProvider({
  assetKeys,
  knownAssets,
  catalog,
  children,
}: {
  readonly assetKeys: readonly string[];
  readonly knownAssets: readonly ApiCollectAsset[];
  readonly catalog: ApiCollectCatalog | undefined;
  readonly children: ReactNode;
}) {
  const known = useMemo(
    () =>
      new Map(
        knownAssets
          .filter((asset) => matchingCollectAsset(asset.asset_key, asset))
          .map((asset) => [asset.asset_key, asset])
      ),
    [knownAssets]
  );
  const needed = [...new Set(assetKeys)]
    .filter((key) => !known.has(key))
    .sort((left, right) => {
      if (left < right) return -1;
      return left > right ? 1 : 0;
    });
  const metadata = useQuery({
    queryKey: [
      QueryKey.COLLECT_ASSETS,
      "plan-metadata",
      catalog?.version,
      needed,
    ],
    queryFn: async ({ signal }) => {
      const deadline = createFetchDeadline(
        signal,
        15_000,
        () => new Error("Collecting metadata timed out")
      );
      try {
        return await deadline.run(() =>
          loadCollectPlanMetadata(needed, deadline.signal)
        );
      } finally {
        deadline.dispose();
      }
    },
    enabled: needed.length > 0,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const value = useMemo(() => {
    const assets = new Map(known);
    for (const asset of metadata.data ?? []) assets.set(asset.asset_key, asset);
    return { assets, catalog };
  }, [known, metadata.data, catalog]);
  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}
