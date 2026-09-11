import type {
  EtherscanPreviewBase,
  EtherscanTarget,
} from "@/lib/link-preview/etherscan/types";

export const ROUTE_ONLY_TTL_MS = 24 * 60 * 60 * 1000;
export const IMMUTABLE_TTL_MS = 24 * 60 * 60 * 1000;
export const PENDING_TTL_MS = 10 * 1000;
export const RECENT_TTL_MS = 30 * 1000;
export const ADDRESS_TTL_MS = 45 * 1000;
export const TOKEN_TTL_MS = 5 * 60 * 1000;

function getCacheMetadata(ttlMs: number) {
  return {
    maxAgeSeconds: Math.max(1, Math.floor(ttlMs / 1000)),
    staleWhileRevalidateSeconds: Math.max(5, Math.floor(ttlMs / 1000)),
    immutable: ttlMs >= IMMUTABLE_TTL_MS ? true : undefined,
  };
}

export function createBase(
  target: EtherscanTarget,
  options: {
    readonly completeness: EtherscanPreviewBase["completeness"];
    readonly ttlMs: number;
    readonly blockNumber?: string | undefined;
    readonly hasRpc?: boolean | undefined;
  }
): EtherscanPreviewBase {
  return {
    provider: "etherscan",
    requestUrl: target.requestUrl,
    canonicalUrl: target.canonicalUrl,
    network: target.network,
    routeFamily: target.routeFamily,
    contexts: target.contexts,
    provenance: options.hasRpc
      ? [
          {
            source: "rpc",
            asOf: new Date().toISOString(),
            blockNumber: options.blockNumber,
            confidence: "authoritative",
          },
        ]
      : [],
    completeness: options.completeness,
    stale: false,
    cache: getCacheMetadata(options.ttlMs),
  };
}
