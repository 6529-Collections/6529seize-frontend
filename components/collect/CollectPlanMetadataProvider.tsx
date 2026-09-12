"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
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
  const known = new Map(
    knownAssets
      .filter((asset) => matchingCollectAsset(asset.asset_key, asset))
      .map((asset) => [asset.asset_key, asset])
  );
  const needed = [...new Set(assetKeys)]
    .filter((key) => !known.has(key))
    .sort();
  const metadata = useQuery({
    queryKey: [
      QueryKey.COLLECT_ASSETS,
      "plan-metadata",
      catalog?.version,
      needed,
    ],
    queryFn: ({ signal }) =>
      loadCollectPlanMetadata(
        needed,
        AbortSignal.any([signal, AbortSignal.timeout(15_000)])
      ),
    enabled: needed.length > 0,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  for (const asset of metadata.data ?? []) known.set(asset.asset_key, asset);
  return (
    <MetadataContext.Provider value={{ assets: known, catalog }}>
      {children}
    </MetadataContext.Provider>
  );
}
