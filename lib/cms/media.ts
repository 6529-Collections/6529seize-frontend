import { publicEnv } from "@/config/env";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? trimTrailingSlash(value.slice(0, -1)) : value;
}

function getIpfsGatewayBase(): string {
  const endpoint = trimTrailingSlash(publicEnv.IPFS_GATEWAY_ENDPOINT);
  return endpoint.endsWith("/ipfs") ? endpoint.slice(0, -5) : endpoint;
}

export function resolveCmsMediaUrl(src: string): string {
  if (!src.toLowerCase().startsWith("ipfs://")) {
    return src;
  }

  return `${getIpfsGatewayBase()}/ipfs/${src.slice("ipfs://".length)}`;
}

export function findCmsAsset<TAsset extends { readonly id: string }>(
  assets: readonly TAsset[],
  assetId: string
): TAsset | null {
  return assets.find((asset) => asset.id === assetId) ?? null;
}
