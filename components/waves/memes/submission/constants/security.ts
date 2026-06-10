import type { InteractiveMediaProvider } from "./media";
import {
  canonicalizeArweaveGatewayHostname,
  isArweaveGatewayRuntimeHost,
} from "@/lib/media/arweave-gateways";
import { getConfiguredIpfsGatewayHost } from "@/lib/media/ipfs-gateways";
import {
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";
import { publicEnv } from "@/config/env";

const DEFAULT_INTERACTIVE_MEDIA_IPFS_HOSTS = ["ipfs.io", "www.ipfs.io"];
const MEDIA_RESOLVER_HOST = "media.6529.io";

const INTERACTIVE_MEDIA_IPFS_HOSTS = new Set<string>(
  [
    ...DEFAULT_INTERACTIVE_MEDIA_IPFS_HOSTS,
    getConfiguredIpfsGatewayHost(publicEnv.IPFS_GATEWAY_ENDPOINT),
  ].filter((value): value is string => Boolean(value))
);

const ARWEAVE_SUBDOMAIN_PATTERN = /^([a-z0-9_-]{43,87})\.arweave\.net$/;

const CIDV0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CIDV1_PATTERN = /^b[a-z2-7]{52,}$/;

const ARWEAVE_TX_ID_PATTERN = /^[a-zA-Z0-9_-]{43,87}$/;

const IPFS_PATH_PATTERN = /^\/ipfs\/([^/]+)(?:\/(.*))?$/;
const ARWEAVE_PATH_PATTERN = /^\/([^/]+)$/;
const IPFS_HTML_PATH_PATTERN = /\.html?$/i;

export const canonicalizeInteractiveMediaHostname = (
  hostname: string
): string => {
  return canonicalizeArweaveGatewayHostname(hostname);
};

const isIpfsHost = (hostname: string): boolean =>
  INTERACTIVE_MEDIA_IPFS_HOSTS.has(
    canonicalizeInteractiveMediaHostname(hostname)
  );

const getArweaveTransactionIdFromSubdomain = (
  hostname: string
): string | null => {
  const normalized = canonicalizeInteractiveMediaHostname(hostname);
  const match = ARWEAVE_SUBDOMAIN_PATTERN.exec(normalized);
  return match ? match[1]! : null;
};

const isArweaveHost = (hostname: string): boolean => {
  return isArweaveGatewayRuntimeHost(hostname);
};

const getInteractiveMediaProviderForHost = (
  hostname: string
): InteractiveMediaProvider | null => {
  if (isIpfsHost(hostname)) {
    return "ipfs";
  }

  if (isArweaveHost(hostname)) {
    return "arweave";
  }

  return null;
};

export const isInteractiveMediaAllowedHost = (hostname: string): boolean =>
  canonicalizeInteractiveMediaHostname(hostname) === MEDIA_RESOLVER_HOST ||
  getInteractiveMediaProviderForHost(hostname) !== null ||
  parseDecentralizedMediaRef(
    `https://${canonicalizeInteractiveMediaHostname(hostname)}`
  ) !== null;

const isValidIpfsCid = (cid: string): boolean =>
  CIDV0_PATTERN.test(cid) || CIDV1_PATTERN.test(cid);

const isValidArweaveTransactionId = (txId: string): boolean =>
  ARWEAVE_TX_ID_PATTERN.test(txId);

const isSafeIpfsNestedContentPath = (path: string | undefined): boolean => {
  if (!path) {
    return true;
  }

  if (!IPFS_HTML_PATH_PATTERN.test(path)) {
    return false;
  }

  return path.split("/").every((segment) => {
    if (!segment || segment === "." || segment === "..") {
      return false;
    }

    try {
      const decodedSegment = decodeURIComponent(segment);
      return (
        decodedSegment === segment &&
        decodedSegment !== "." &&
        decodedSegment !== ".." &&
        !decodedSegment.includes("/") &&
        !decodedSegment.includes("\\")
      );
    } catch {
      return false;
    }
  });
};

export const isInteractiveMediaContentIdentifier = (
  provider: InteractiveMediaProvider,
  identifier: string
): boolean => {
  if (!identifier) {
    return false;
  }

  const trimmed = identifier.trim();
  if (!trimmed || trimmed !== identifier) {
    return false;
  }

  if (provider === "ipfs") {
    return isValidIpfsCid(trimmed);
  }

  if (provider === "arweave") {
    return isValidArweaveTransactionId(trimmed);
  }

  return false;
};

export const isInteractiveMediaContentPathAllowed = (
  hostname: string,
  pathname: string
): boolean => {
  const normalizedHostname = canonicalizeInteractiveMediaHostname(hostname);
  const parsedMedia = parseDecentralizedMediaRef(
    `https://${normalizedHostname}${pathname}`
  );
  if (parsedMedia?.protocol === "ipfs") {
    if (!isInteractiveMediaContentIdentifier("ipfs", parsedMedia.id)) {
      return false;
    }
    return isSafeIpfsNestedContentPath(parsedMedia.path || undefined);
  }

  if (parsedMedia?.protocol === "arweave") {
    return (
      !parsedMedia.path &&
      isInteractiveMediaContentIdentifier("arweave", parsedMedia.id)
    );
  }

  const provider = getInteractiveMediaProviderForHost(hostname);
  if (!provider) {
    return false;
  }

  if (provider === "ipfs") {
    let normalizedPath = pathname;
    while (normalizedPath.endsWith("/") && normalizedPath !== "/") {
      normalizedPath = normalizedPath.slice(0, -1);
    }

    const match = IPFS_PATH_PATTERN.exec(normalizedPath);
    if (!match) {
      return false;
    }

    if (!isInteractiveMediaContentIdentifier(provider, match[1]!)) {
      return false;
    }

    return isSafeIpfsNestedContentPath(match[2]);
  }

  if (provider === "arweave") {
    const subdomainIdentifier = getArweaveTransactionIdFromSubdomain(hostname);
    if (subdomainIdentifier) {
      if (!isInteractiveMediaContentIdentifier(provider, subdomainIdentifier)) {
        return false;
      }

      if (pathname === "/") {
        return true;
      }

      const subdomainMatch = ARWEAVE_PATH_PATTERN.exec(pathname);
      if (!subdomainMatch) {
        return false;
      }

      return isInteractiveMediaContentIdentifier(provider, subdomainMatch[1]!);
    }

    const match = ARWEAVE_PATH_PATTERN.exec(pathname);
    if (!match) {
      return false;
    }

    return isInteractiveMediaContentIdentifier(provider, match[1]!);
  }

  return false;
};

const canonicalizeNativeInteractiveMediaUrl = (
  src: string
): string | null | undefined => {
  if (!/^(ipfs|ar):\/\//i.test(src)) {
    return undefined;
  }

  const nativeRef = parseDecentralizedMediaRef(src);
  if (nativeRef?.protocol === "ipfs" || nativeRef?.protocol === "arweave") {
    return to6529ResolverUrl(nativeRef, DEFAULT_MEDIA_RESOLVER_ENDPOINT);
  }

  return null;
};

const parseSecureInteractiveMediaUrl = (src: string): URL | null => {
  try {
    const parsedUrl = new URL(src);
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    return parsedUrl;
  } catch {
    return null;
  }
};

const normalizeInteractiveMediaPort = (parsedUrl: URL): boolean => {
  if (!parsedUrl.port) {
    return true;
  }

  if (parsedUrl.port !== "443") {
    return false;
  }

  parsedUrl.port = "";
  return true;
};

const normalizeInteractiveMediaHostname = (parsedUrl: URL): boolean => {
  const normalizedHostname = canonicalizeInteractiveMediaHostname(
    parsedUrl.hostname
  );
  if (!normalizedHostname) {
    return false;
  }

  if (normalizedHostname !== parsedUrl.hostname) {
    parsedUrl.hostname = normalizedHostname;
  }

  return true;
};

const canonicalizeParsedInteractiveMediaUrl = (
  parsedUrl: URL
): string | null => {
  const decentralizedRef = parseDecentralizedMediaRef(parsedUrl.toString());
  if (decentralizedRef) {
    return to6529ResolverUrl(decentralizedRef, DEFAULT_MEDIA_RESOLVER_ENDPOINT);
  }

  return parsedUrl.toString();
};

export const canonicalizeInteractiveMediaUrl = (src: string): string | null => {
  if (/%2e|%2f|%5c/i.test(src)) {
    return null;
  }

  const nativeUrl = canonicalizeNativeInteractiveMediaUrl(src);
  if (nativeUrl !== undefined) return nativeUrl;

  const parsedUrl = parseSecureInteractiveMediaUrl(src);
  if (!parsedUrl) return null;

  if (parsedUrl.username || parsedUrl.password) {
    return null;
  }

  if (parsedUrl.hash) {
    return null;
  }

  if (!normalizeInteractiveMediaPort(parsedUrl)) return null;

  if (!normalizeInteractiveMediaHostname(parsedUrl)) return null;

  if (!isInteractiveMediaAllowedHost(parsedUrl.hostname)) {
    return null;
  }

  if (
    !isInteractiveMediaContentPathAllowed(
      parsedUrl.hostname,
      parsedUrl.pathname
    )
  ) {
    return null;
  }

  parsedUrl.username = "";
  parsedUrl.password = "";
  parsedUrl.hash = "";

  return canonicalizeParsedInteractiveMediaUrl(parsedUrl);
};

export const INTERACTIVE_MEDIA_GATEWAY_BASE_URL: Record<
  InteractiveMediaProvider,
  string
> = {
  ipfs: `${DEFAULT_MEDIA_RESOLVER_ENDPOINT}/ipfs/`,
  arweave: `${DEFAULT_MEDIA_RESOLVER_ENDPOINT}/arweave/`,
};

export const INTERACTIVE_MEDIA_ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
];

export interface InteractiveMediaValidationResult {
  readonly ok: boolean;
  readonly reason?: string | undefined;
  readonly contentType?: string | null | undefined;
  readonly finalUrl?: string | undefined;
}
