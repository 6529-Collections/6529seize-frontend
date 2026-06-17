import { publicEnv } from "@/config/env";
import {
  normalizeDecentralizedMediaUrl,
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";
import { CMS_SAFE_URI_PROTOCOLS } from "@/lib/profile-cms/protocol/v1";

const SAFE_URI_PROTOCOLS = new Set<string>(CMS_SAFE_URI_PROTOCOLS);

export function isSafeCmsRelativeUri(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  if (/[\\\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }

  const lowercaseValue = value.toLowerCase();
  return (
    !lowercaseValue.startsWith("/%2f") && !lowercaseValue.startsWith("/%5c")
  );
}

export function isSafeCmsUri(
  value: string | null | undefined,
  { allowRelative = false }: { readonly allowRelative?: boolean } = {}
): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (allowRelative && isSafeCmsRelativeUri(trimmed)) {
    return true;
  }

  try {
    return SAFE_URI_PROTOCOLS.has(new URL(trimmed).protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function resolveCmsUri(
  value: string | null | undefined,
  { allowRelative = false }: { readonly allowRelative?: boolean } = {}
): string | null {
  if (!isSafeCmsUri(value, { allowRelative })) {
    return null;
  }

  const trimmed = value.trim();
  if (allowRelative && isSafeCmsRelativeUri(trimmed)) {
    return trimmed;
  }

  const parsed = parseDecentralizedMediaRef(trimmed);
  if (parsed) {
    return to6529ResolverUrl(parsed, publicEnv.MEDIA_RESOLVER_ENDPOINT);
  }

  if (/^ipfs:\/\//i.test(trimmed)) {
    return toResolverUrl("ipfs", trimmed.replace(/^ipfs:\/\//i, ""));
  }

  if (/^ar:\/\//i.test(trimmed)) {
    return toResolverUrl("arweave", trimmed.replace(/^ar:\/\//i, ""));
  }

  if (/^arweave:\/\//i.test(trimmed)) {
    return toResolverUrl("arweave", trimmed.replace(/^arweave:\/\//i, ""));
  }

  return (
    normalizeDecentralizedMediaUrl(trimmed, publicEnv.MEDIA_RESOLVER_ENDPOINT) ??
    null
  );
}

export function isExternalCmsHref(href: string): boolean {
  try {
    const url = new URL(href, publicEnv.BASE_ENDPOINT);
    return url.origin !== new URL(publicEnv.BASE_ENDPOINT).origin;
  } catch {
    return false;
  }
}

function toResolverUrl(prefix: "ipfs" | "arweave", value: string): string {
  const path = value
    .split("/")
    .filter((part) => part.trim().length > 0)
    .map(encodePathPart)
    .join("/");
  const endpoint = publicEnv.MEDIA_RESOLVER_ENDPOINT.replace(/\/+$/, "");
  return `${endpoint}/${prefix}/${path}`;
}

function encodePathPart(value: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
}
