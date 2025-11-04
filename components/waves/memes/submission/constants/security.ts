import { InteractiveMediaProvider } from "./media";

const INTERACTIVE_MEDIA_IPFS_HOSTS = new Set<string>([
  "ipfs.io",
  "www.ipfs.io",
]);

const ARWEAVE_ROOT_HOSTS = new Set<string>(["arweave.net", "www.arweave.net"]);
const ARWEAVE_SUBDOMAIN_PATTERN = /^([a-z0-9_-]{43})\.arweave\.net$/;

const CIDV0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CIDV1_PATTERN = /^b[a-z2-7]{52,}$/;

const ARWEAVE_TX_ID_PATTERN = /^[a-zA-Z0-9_-]{43}$/;

const IPFS_PATH_PATTERN = /^\/ipfs\/([^/]+)(?:\/)?$/;
const ARWEAVE_PATH_PATTERN = /^\/([^/]+)(?:\/)?$/;

export const canonicalizeInteractiveMediaHostname = (
  hostname: string
): string => {
  let normalized = hostname.toLowerCase();
  while (normalized.endsWith(".")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

const isIpfsHost = (hostname: string): boolean =>
  INTERACTIVE_MEDIA_IPFS_HOSTS.has(canonicalizeInteractiveMediaHostname(hostname));

const getArweaveTransactionIdFromSubdomain = (
  hostname: string
): string | null => {
  const normalized = canonicalizeInteractiveMediaHostname(hostname);
  const match = ARWEAVE_SUBDOMAIN_PATTERN.exec(normalized);
  return match ? match[1] : null;
};

const isArweaveHost = (hostname: string): boolean => {
  const normalized = canonicalizeInteractiveMediaHostname(hostname);
  if (ARWEAVE_ROOT_HOSTS.has(normalized)) {
    return true;
  }

  return getArweaveTransactionIdFromSubdomain(hostname) !== null;
};

export const getInteractiveMediaProviderForHost = (
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
  getInteractiveMediaProviderForHost(hostname) !== null;

const isValidIpfsCid = (cid: string): boolean =>
  CIDV0_PATTERN.test(cid) || CIDV1_PATTERN.test(cid);

const isValidArweaveTransactionId = (txId: string): boolean =>
  ARWEAVE_TX_ID_PATTERN.test(txId);

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
  const provider = getInteractiveMediaProviderForHost(hostname);
  if (!provider) {
    return false;
  }

  if (provider === "ipfs") {
    const match = IPFS_PATH_PATTERN.exec(pathname);
    if (!match) {
      return false;
    }

    return isInteractiveMediaContentIdentifier(provider, match[1]);
  }

  if (provider === "arweave") {
    const subdomainIdentifier = getArweaveTransactionIdFromSubdomain(hostname);
    if (subdomainIdentifier) {
      return (
        pathname === "/" &&
        isInteractiveMediaContentIdentifier(provider, subdomainIdentifier)
      );
    }

    const match = ARWEAVE_PATH_PATTERN.exec(pathname);
    if (!match) {
      return false;
    }

    return isInteractiveMediaContentIdentifier(provider, match[1]);
  }

  return false;
};

export const INTERACTIVE_MEDIA_GATEWAY_BASE_URL: Record<
  InteractiveMediaProvider,
  string
> = {
  ipfs: "https://ipfs.io/ipfs/",
  arweave: "https://arweave.net/",
};

export const INTERACTIVE_MEDIA_ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
];

export interface InteractiveMediaValidationResult {
  readonly ok: boolean;
  readonly reason?: string;
  readonly contentType?: string | null;
  readonly finalUrl?: string;
}
