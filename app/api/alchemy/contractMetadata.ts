import LruTtlCache from "@/lib/cache/lruTtl";
import { resolveNetwork } from "@/services/alchemy/utils";
import type { SupportedChain } from "@/types/nft";
import { fetchAlchemyJson } from "./fetchAlchemyJson";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
// Contract metadata responses are a few kilobytes.
const MAX_RESPONSE_BYTES = 256 * 1024;

export type ContractMetadataEntry = {
  readonly address: `0x${string}`;
  readonly chain: SupportedChain;
  readonly metadata: Record<string, unknown> | null;
  readonly error?: string | undefined;
  readonly status?: number | undefined;
};

// Shared by the single and batch contract routes; misses are not cached.
const contractCache = new LruTtlCache<string, ContractMetadataEntry>({
  max: MAX_CACHE_ENTRIES,
  ttlMs: CACHE_TTL_MS,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getContractCacheKey(
  address: `0x${string}`,
  chain: SupportedChain
): string {
  return `${chain}:${address.toLowerCase()}`;
}

/** Fetches Alchemy contract metadata, caching found and not-found results. */
export async function fetchContractMetadata({
  address,
  apiKey,
  chain,
  signal,
}: {
  readonly address: `0x${string}`;
  readonly apiKey: string;
  readonly chain: SupportedChain;
  readonly signal: AbortSignal;
}): Promise<ContractMetadataEntry> {
  const cacheKey = getContractCacheKey(address, chain);
  const cached = contractCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const network = resolveNetwork(chain);
  const url = `https://${network}.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata?contractAddress=${address}`;
  const result = await fetchAlchemyJson(url, {
    maxBytes: MAX_RESPONSE_BYTES,
    signal,
  });

  if (!result.ok && result.status === 404) {
    const entry: ContractMetadataEntry = { address, chain, metadata: null };
    contractCache.set(cacheKey, entry);
    return entry;
  }

  if (!result.ok) {
    return {
      address,
      chain,
      metadata: null,
      error: "Failed to fetch contract metadata",
      status: result.status,
    };
  }

  const { payload } = result;
  if (!isRecord(payload)) {
    return {
      address,
      chain,
      metadata: null,
      error: "Invalid contract metadata response",
      status: 502,
    };
  }

  const entry: ContractMetadataEntry = {
    address,
    chain,
    metadata: { ...payload, _checksum: address },
  };
  contractCache.set(cacheKey, entry);
  return entry;
}
