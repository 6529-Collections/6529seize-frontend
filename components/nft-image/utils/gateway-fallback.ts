import type React from "react";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { publicEnv } from "@/config/env";
import {
  ARWEAVE_FALLBACK_HOSTS,
  canonicalizeArweaveGatewayHostname,
  isArweaveGatewayRuntimeHost,
} from "@/lib/media/arweave-gateways";
import { parseIpfsUrl } from "@/helpers/Helpers";

const DEFAULT_IPFS_GATEWAY_HOSTS = new Set([
  "ipfs.io",
  "www.ipfs.io",
  "cf-ipfs.com",
]);

function dedupe(list: readonly string[]): string[] {
  return Array.from(new Set(list));
}

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function normalizeHost(hostname: string): string {
  return canonicalizeArweaveGatewayHostname(hostname);
}

function isArweaveGatewayHost(hostname: string): boolean {
  return isArweaveGatewayRuntimeHost(hostname);
}

function isArweaveUrl(url: string): boolean {
  const u = safeParseUrl(url);
  return !!u && isArweaveGatewayHost(u.hostname);
}

function isIpfsProtocolUrl(url: string): boolean {
  return url.trim().toLowerCase().startsWith("ipfs://");
}

function getConfiguredIpfsGatewayHost(): string | null {
  const gatewayEndpoint = publicEnv.IPFS_GATEWAY_ENDPOINT;
  if (!gatewayEndpoint) {
    return null;
  }

  try {
    const parsedUrl = new URL(gatewayEndpoint);
    return canonicalizeArweaveGatewayHostname(parsedUrl.hostname);
  } catch {
    return null;
  }
}

function isKnownIpfsGatewayHost(hostname: string): boolean {
  const normalizedHostname = canonicalizeArweaveGatewayHostname(hostname);
  return (
    DEFAULT_IPFS_GATEWAY_HOSTS.has(normalizedHostname) ||
    normalizedHostname === getConfiguredIpfsGatewayHost()
  );
}

function getIpfsProtocolUrlFromGatewayUrl(url: string): string | null {
  const parsedUrl = safeParseUrl(url);
  if (!parsedUrl || !isKnownIpfsGatewayHost(parsedUrl.hostname)) {
    return null;
  }

  const pathMatch = /^\/ipfs\/(.+)$/.exec(parsedUrl.pathname);
  if (!pathMatch) {
    return null;
  }

  const identifierPath = pathMatch[1];
  if (!identifierPath) {
    return null;
  }

  return `ipfs://${identifierPath}${parsedUrl.search}${parsedUrl.hash}`;
}

function getIpfsFallbackUrls(url: string): string[] {
  const primaryUrl = resolveIpfsUrlSync(url);
  const fallbackUrl = parseIpfsUrl(url);

  return dedupe([primaryUrl, fallbackUrl].filter(Boolean));
}

function buildUrlWithGateway(
  originalUrl: string,
  gatewayHost: string
): string | null {
  const u = safeParseUrl(originalUrl);
  if (!u) return null;

  u.hostname = gatewayHost;
  u.host = gatewayHost + (u.port ? `:${u.port}` : "");
  return u.toString();
}

type MediaErrorEvent = React.SyntheticEvent<
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLIFrameElement
  | (HTMLElement & { src: string }),
  Event
>;

const DS_ORIGINAL = "arweaveOriginalSrc";
const DS_LAST_HOST = "arweaveLastGatewayHost";

export function getArweaveGatewayFallbackUrls(url: string): string[] {
  const trimmed = url.trim();
  if (!trimmed) {
    return [];
  }
  if (isIpfsProtocolUrl(trimmed)) {
    return getIpfsFallbackUrls(trimmed);
  }
  const ipfsProtocolUrl = getIpfsProtocolUrlFromGatewayUrl(trimmed);
  if (ipfsProtocolUrl) {
    return getIpfsFallbackUrls(ipfsProtocolUrl);
  }
  if (!isArweaveUrl(trimmed)) {
    return [trimmed];
  }
  return getTryList(trimmed, trimmed);
}

function getTryList(currentSrc: string, originalSrc: string): string[] {
  const current = safeParseUrl(currentSrc);
  const orig = safeParseUrl(originalSrc);

  // Always try the exact originalSrc first.
  const base: string[] = [originalSrc];

  // If we can parse the host, skip it in fallbacks to avoid dumb retries.
  const currentHost = current ? normalizeHost(current.hostname) : null;
  const origHost = orig ? normalizeHost(orig.hostname) : null;

  // Build gateway variants from originalSrc (preserves path/query exactly).
  const variants = ARWEAVE_FALLBACK_HOSTS.filter((h) => h !== origHost) // original already first in base
    .filter((h) => h !== currentHost) // skip current host too
    .map((h) => buildUrlWithGateway(originalSrc, h))
    .filter((u): u is string => !!u);

  return dedupe([...base, ...variants]);
}

export function withArweaveFallback(
  onError?: (event: MediaErrorEvent) => void
): (event: MediaErrorEvent) => void {
  return (event: MediaErrorEvent) => {
    const target = event.currentTarget;
    const currentSrc = target.src;

    if (!currentSrc || !isArweaveUrl(currentSrc)) {
      onError?.(event);
      return;
    }

    // Establish the "original" src once per media load.
    // Only reset it if the app code changed `src` to a *non-gateway-swapped* URL.
    const storedOriginal = target.dataset[DS_ORIGINAL];
    const originalSrc = storedOriginal ?? currentSrc;

    if (!storedOriginal) {
      target.dataset[DS_ORIGINAL] = originalSrc;
    }

    const tryList = getTryList(currentSrc, originalSrc);

    // Track what we last tried so we can advance deterministically.
    const lastHost = target.dataset[DS_LAST_HOST];
    const currentHost = (() => {
      const u = safeParseUrl(currentSrc);
      return u ? normalizeHost(u.hostname) : null;
    })();

    // Find next URL to try:
    // - If we have lastHost, advance from that in the tryList.
    // - Otherwise, advance from currentSrc.
    let nextUrl: string | null = null;

    // Prefer stepping from the exact currentSrc position if present
    const curIdx = tryList.indexOf(currentSrc);
    if (curIdx >= 0 && curIdx + 1 < tryList.length) {
      nextUrl = tryList[curIdx + 1] ?? null;
    } else if (lastHost) {
      // Fallback: step based on host
      const lastIdx = tryList.findIndex((u) => {
        const p = safeParseUrl(u);
        return p ? normalizeHost(p.hostname) === lastHost : false;
      });
      if (lastIdx >= 0 && lastIdx + 1 < tryList.length) {
        nextUrl = tryList[lastIdx + 1] ?? null;
      }
    } else {
      // Final fallback: just try the second item
      nextUrl = tryList[1] ?? null;
    }

    if (!nextUrl) {
      onError?.(event);
      return;
    }

    const nextParsed = safeParseUrl(nextUrl);
    if (nextParsed) {
      target.dataset[DS_LAST_HOST] = normalizeHost(nextParsed.hostname);
    } else if (currentHost) {
      target.dataset[DS_LAST_HOST] = currentHost;
    }

    target.src = nextUrl;
  };
}
