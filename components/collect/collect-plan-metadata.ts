import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { fetchCollectAssets } from "@/services/api/collect-api";
import { collectAssetIdentity } from "./collect.adapters";

interface MetadataJob {
  family: ApiCollectFamily;
  query: string;
  pages: number;
}

function resolvedSearch(
  found: ReadonlyMap<string, ApiCollectAsset>,
  job: MetadataJob
) {
  return [...found.values()].some(
    (asset) => asset.family === job.family && asset.token_id === job.query
  );
}

function retainKnownMetadata(
  assets: readonly ApiCollectAsset[],
  wanted: ReadonlySet<string>,
  found: Map<string, ApiCollectAsset>
) {
  for (const asset of assets) {
    if (
      wanted.has(asset.asset_key) &&
      matchingCollectAsset(asset.asset_key, asset)
    )
      found.set(asset.asset_key, asset);
  }
}

async function readMetadataJob(
  job: MetadataJob,
  wanted: ReadonlySet<string>,
  found: Map<string, ApiCollectAsset>,
  budget: { remaining: number },
  signal: AbortSignal
) {
  for (let page = 1; page <= job.pages; page++) {
    signal.throwIfAborted();
    if (budget.remaining-- <= 0) return;
    const result = await fetchCollectAssets({
      family: job.family,
      query: job.query,
      page,
      signal,
    });
    signal.throwIfAborted();
    if (result.page !== page) return;
    retainKnownMetadata(result.data, wanted, found);
    if (!result.next || result.data.length === 0 || found.size === wanted.size)
      return;
    // Search matches names too; only the exact canonical NFT ends the lookup.
    if (job.query && resolvedSearch(found, job)) return;
  }
}

export function matchingCollectAsset(
  key: string,
  asset: ApiCollectAsset | undefined
): ApiCollectAsset | undefined {
  const identity = collectAssetIdentity(key);
  return identity &&
    key.split(":").length === 3 &&
    asset?.asset_key === key &&
    asset.chain_id === 1 &&
    asset.family === identity.family &&
    asset.token_id === identity.tokenId &&
    `1:${asset.contract.toLowerCase()}:${asset.token_id}` === key
    ? asset
    : undefined;
}

/** Public metadata only; bounds avoid one request per NFT for a full Memes set. */
export async function loadCollectPlanMetadata(
  assetKeys: readonly string[],
  signal: AbortSignal
): Promise<ApiCollectAsset[]> {
  const wanted = new Set(assetKeys.slice(0, 1024));
  const found = new Map<string, ApiCollectAsset>();
  const families = new Map<ApiCollectFamily, string[]>();
  for (const key of wanted) {
    const identity = collectAssetIdentity(key);
    if (!identity || key.split(":").length !== 3) continue;
    const keys = families.get(identity.family) ?? [];
    keys.push(key);
    families.set(identity.family, keys);
  }
  const jobs: MetadataJob[] = [];
  for (const [family, keys] of families) {
    if (family !== ApiCollectFamily.Pebbles && keys.length > 12)
      jobs.push({ family, query: "", pages: 64 });
    else
      for (const key of keys)
        jobs.push({
          family,
          query: collectAssetIdentity(key)!.tokenId,
          pages: 4,
        });
  }
  let next = 0;
  const budget = { remaining: 96 };
  async function worker() {
    while (next < jobs.length) {
      signal.throwIfAborted();
      await readMetadataJob(jobs[next++]!, wanted, found, budget, signal);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));
  return [...found.values()];
}
