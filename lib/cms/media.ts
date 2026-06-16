import { publicEnv } from "@/config/env";

const IPFS_PROTOCOL = "ipfs://";
const ARWEAVE_PROTOCOL = "ar://";
const LOCAL_MEDIA_FALLBACK = "/6529io.png";
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const UNSAFE_URL_CHARACTER_PATTERN = /[\u0000-\u0020\u007f\\]/;

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? trimTrailingSlash(value.slice(0, -1)) : value;
}

function getIpfsGatewayBase(): string {
  const endpoint = trimTrailingSlash(publicEnv.IPFS_GATEWAY_ENDPOINT);
  return endpoint.endsWith("/ipfs") ? endpoint.slice(0, -5) : endpoint;
}

function isSafeRelativeCmsUrl(value: string): boolean {
  if (value.startsWith("//")) {
    return false;
  }

  return (
    value.startsWith("/") || value.startsWith("./") || value.startsWith("../")
  );
}

export function resolveSafeCmsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || UNSAFE_URL_CHARACTER_PATTERN.test(trimmed)) {
    return null;
  }

  const lowerValue = trimmed.toLowerCase();
  if (lowerValue.startsWith(IPFS_PROTOCOL)) {
    const ipfsPath = trimmed.slice(IPFS_PROTOCOL.length);
    return ipfsPath ? `${getIpfsGatewayBase()}/ipfs/${ipfsPath}` : null;
  }

  if (lowerValue.startsWith(ARWEAVE_PROTOCOL)) {
    const arweavePath = trimmed.slice(ARWEAVE_PROTOCOL.length);
    return arweavePath ? `https://arweave.net/${arweavePath}` : null;
  }

  if (!URL_SCHEME_PATTERN.test(trimmed)) {
    return isSafeRelativeCmsUrl(trimmed) ? trimmed : null;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function resolveCmsLinkUrl(href: string): string | null {
  return resolveSafeCmsUrl(href);
}

export function resolveCmsMediaUrl(src: string): string | null {
  return resolveSafeCmsUrl(src);
}

export function getSafeCmsMediaUrl(src: string): string {
  return resolveCmsMediaUrl(src) ?? LOCAL_MEDIA_FALLBACK;
}

export function findCmsAsset<TAsset extends { readonly id: string }>(
  assets: readonly TAsset[],
  assetId: string
): TAsset | null {
  return assets.find((asset) => asset.id === assetId) ?? null;
}
