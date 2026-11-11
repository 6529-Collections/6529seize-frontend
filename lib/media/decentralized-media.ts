import { toCidV1Base32Label } from "./cid";

export const DEFAULT_MEDIA_RESOLVER_ENDPOINT = "https://media.6529.io";

/**
 * User-provided media can be served from a separate content domain. The media
 * resolver endpoint selects it: when the endpoint is
 * `https://media.6529usercontent.com`, HTML is framed and opened from one host
 * per CID (`<cidv1>.ipfs.6529usercontent.com`) and every other media type uses
 * the path host. Any other endpoint keeps the path host for everything.
 */
const USER_CONTENT_DOMAIN = "6529usercontent.com";
const USER_CONTENT_MEDIA_HOST = `media.${USER_CONTENT_DOMAIN}`;
const USER_CONTENT_MEDIA_ORIGIN = `https://${USER_CONTENT_MEDIA_HOST}`;
const USER_CONTENT_IPFS_HOST_SUFFIX = `.ipfs.${USER_CONTENT_DOMAIN}`;

/** Content Security Policy sources for the separate content domain. */
export const USER_CONTENT_CSP_SOURCES = [
  USER_CONTENT_MEDIA_ORIGIN,
  `https://*${USER_CONTENT_IPFS_HOST_SUFFIX}`,
] as const;

export type DecentralizedMediaProtocol = "ipfs" | "ipns" | "arweave";

export type DecentralizedMediaRef = {
  readonly protocol: DecentralizedMediaProtocol;
  readonly id: string;
  readonly path: string;
};

type DecentralizedMediaResolution = {
  readonly input: string;
  readonly recognized: boolean;
  readonly protocol?: DecentralizedMediaProtocol;
  readonly native_uri?: string;
  readonly id?: string;
  readonly path?: string;
  readonly resolver_url?: string;
  readonly external_fallback_urls: string[];
  readonly warnings: string[];
};

type ResolveDecentralizedMediaOptions = {
  readonly includeExternalFallbacks?: boolean;
  readonly resolverEndpoint?: string;
};

const MEDIA_RESOLVER_HOST = "media.6529.io";

/**
 * Path hosts of the app's own media resolver, current and previous. URLs on
 * any of them are understood whichever endpoint is configured.
 */
export const FIRST_PARTY_MEDIA_RESOLVER_HOSTS = [
  MEDIA_RESOLVER_HOST,
  USER_CONTENT_MEDIA_HOST,
] as const;

// Older names of the 6529 path gateway. Stored URLs on them still parse, but
// the app never builds new URLs on them.
const LEGACY_FIRST_PARTY_IPFS_PATH_HOSTS = ["ipfs-cache.6529.io"] as const;
const LEGACY_FIRST_PARTY_FALLBACK_HOSTS = new Set<string>(["ipfs.6529.io"]);

export const IPFS_PATH_GATEWAY_HOSTS = [
  "ipfs.io",
  "cf-ipfs.com",
  "cloudflare-ipfs.com",
  "gateway.pinata.cloud",
  "ipfs.6529.io",
] as const;

export const IPFS_SUBDOMAIN_GATEWAY_SUFFIXES = [
  ".ipfs.nftstorage.link",
  ".ipfs.dweb.link",
  ".ipfs.cf-ipfs.com",
] as const;

export const ARWEAVE_GATEWAY_HOSTS = [
  "arweave.net",
  "gateway.arweave.net",
  "gateway.ar.io",
  "ar-io.net",
  "ardrive.net",
] as const;

export const ARWEAVE_TX_SUBDOMAIN_SUFFIXES = [
  ".arweave.net",
  ".ar.io",
] as const;

const IPFS_PATH_GATEWAY_SET = new Set<string>([
  ...IPFS_PATH_GATEWAY_HOSTS,
  ...LEGACY_FIRST_PARTY_IPFS_PATH_HOSTS,
]);
const FIRST_PARTY_MEDIA_RESOLVER_SET = new Set<string>(
  FIRST_PARTY_MEDIA_RESOLVER_HOSTS
);
const FIRST_PARTY_MEDIA_HOST_SET = new Set<string>([
  ...FIRST_PARTY_MEDIA_RESOLVER_HOSTS,
  ...LEGACY_FIRST_PARTY_FALLBACK_HOSTS,
  ...LEGACY_FIRST_PARTY_IPFS_PATH_HOSTS,
]);
// Input-only: the per-CID host of the content domain is never a fallback.
const IPFS_SUBDOMAIN_INPUT_SUFFIXES: readonly string[] = [
  ...IPFS_SUBDOMAIN_GATEWAY_SUFFIXES,
  USER_CONTENT_IPFS_HOST_SUFFIX,
];
const ARWEAVE_GATEWAY_SET = new Set<string>(ARWEAVE_GATEWAY_HOSTS);
const ARWEAVE_TX_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DNS_SAFE_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

type ParsedDecentralizedMedia = {
  readonly ref: DecentralizedMediaRef;
  readonly warnings: string[];
};

export function parseDecentralizedMediaRef(
  input: string | null | undefined
): DecentralizedMediaRef | null {
  return parseDecentralizedMedia(input)?.ref ?? null;
}

export function toNativeUri(ref: DecentralizedMediaRef): string {
  const protocol = ref.protocol === "arweave" ? "ar" : ref.protocol;
  return `${protocol}://${buildPath(ref.id, ref.path)}`;
}

export function to6529ResolverUrl(
  ref: DecentralizedMediaRef,
  resolverEndpoint = DEFAULT_MEDIA_RESOLVER_ENDPOINT
): string {
  const prefix = ref.protocol === "arweave" ? "arweave" : ref.protocol;
  return `${normalizeOrigin(resolverEndpoint)}/${prefix}/${buildPath(
    ref.id,
    ref.path
  )}`;
}

export function toExternalFallbackUrls(
  ref: DecentralizedMediaRef,
  resolverEndpoint?: string
): string[] {
  if (ref.protocol === "arweave") {
    return [
      ...ARWEAVE_GATEWAY_HOSTS.map(
        (host) => `https://${host}/${buildPath(ref.id, ref.path)}`
      ),
      ...(isDnsSafeSubdomainId(ref.id)
        ? ARWEAVE_TX_SUBDOMAIN_SUFFIXES.map((suffix) =>
            buildSubdomainUrl(ref.id, suffix.slice(1), ref.path)
          )
        : []),
    ];
  }

  const pathPrefix = ref.protocol === "ipns" ? "ipns" : "ipfs";
  // With the separate content domain configured, the 6529.io path gateway is
  // no longer offered as a fallback; its URLs are still understood as input.
  const pathGatewayHosts = getIsolatedHtmlHostSuffix(resolverEndpoint)
    ? IPFS_PATH_GATEWAY_HOSTS.filter(
        (host) => !LEGACY_FIRST_PARTY_FALLBACK_HOSTS.has(host)
      )
    : IPFS_PATH_GATEWAY_HOSTS;
  const pathGatewayUrls = pathGatewayHosts.map(
    (host) => `https://${host}/${pathPrefix}/${buildPath(ref.id, ref.path)}`
  );

  if (ref.protocol === "ipns") {
    return pathGatewayUrls;
  }

  return [
    ...pathGatewayUrls,
    ...(isDnsSafeSubdomainId(ref.id)
      ? IPFS_SUBDOMAIN_GATEWAY_SUFFIXES.map((suffix) =>
          buildSubdomainUrl(ref.id, suffix.slice(1), ref.path)
        )
      : []),
  ];
}

export function resolveDecentralizedMediaInputs(
  inputs: readonly string[],
  options: ResolveDecentralizedMediaOptions = {}
): DecentralizedMediaResolution[] {
  return inputs.map((input) => resolveDecentralizedMediaInput(input, options));
}

export function normalizeDecentralizedMediaUrl(
  input: string | null | undefined,
  resolverEndpoint = DEFAULT_MEDIA_RESOLVER_ENDPOINT
): string | undefined {
  if (input == null) return undefined;
  const trimmed = input.trim();
  if (trimmed === "") return undefined;
  const parsed = parseDecentralizedMediaRef(trimmed);
  return parsed ? to6529ResolverUrl(parsed, resolverEndpoint) : trimmed;
}

export function getDecentralizedMediaFetchUrls(
  input: string,
  options: ResolveDecentralizedMediaOptions = {}
): string[] {
  const parsed = parseDecentralizedMediaRef(input);
  if (!parsed) return [input];

  return dedupe([
    to6529ResolverUrl(parsed, options.resolverEndpoint),
    ...(options.includeExternalFallbacks === false
      ? []
      : toExternalFallbackUrls(parsed, options.resolverEndpoint)),
  ]);
}

export function canonicalizeGatewayHostname(hostname: string): string {
  let normalized = hostname.trim().toLowerCase();
  while (normalized.endsWith(".")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function getMediaResolverSource(
  resolverEndpoint: string | undefined
): string {
  if (!resolverEndpoint) {
    return DEFAULT_MEDIA_RESOLVER_ENDPOINT;
  }

  try {
    const parsedUrl = new URL(resolverEndpoint);
    if (parsedUrl.protocol !== "https:") {
      return DEFAULT_MEDIA_RESOLVER_ENDPOINT;
    }
    return parsedUrl.origin;
  } catch {
    return DEFAULT_MEDIA_RESOLVER_ENDPOINT;
  }
}

export function getMediaResolverHostname(
  resolverEndpoint: string | undefined
): string {
  try {
    return new URL(getMediaResolverSource(resolverEndpoint)).hostname;
  } catch {
    return MEDIA_RESOLVER_HOST;
  }
}

/**
 * Host suffix for one-origin-per-CID HTML (`.ipfs.<content domain>`), or null
 * when the configured resolver serves everything from its path host.
 */
function getIsolatedHtmlHostSuffix(
  resolverEndpoint: string | undefined
): string | null {
  return getMediaResolverSource(resolverEndpoint) === USER_CONTENT_MEDIA_ORIGIN
    ? USER_CONTENT_IPFS_HOST_SUFFIX
    : null;
}

/** Whether the configured resolver frames and opens HTML on per-CID hosts. */
export function hasIsolatedHtmlHosts(
  resolverEndpoint: string | undefined
): boolean {
  return getIsolatedHtmlHostSuffix(resolverEndpoint) !== null;
}

/**
 * URL to frame or open HTML from. With the separate content domain
 * configured, IPFS content gets its own origin:
 * `https://<cidv1-base32>.ipfs.<content domain>/<path>`. Everything else (any
 * other endpoint, IPNS, Arweave, CIDs that do not fit one DNS label) gets the
 * resolver's path URL, exactly as `to6529ResolverUrl` builds it.
 *
 * `urlSuffix` is an optional `?query#hash` tail, appended unchanged.
 */
export function toIsolatedHtmlUrl(
  ref: DecentralizedMediaRef,
  resolverEndpoint = DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  urlSuffix = ""
): string {
  const suffix = /^[?#]/.test(urlSuffix) ? urlSuffix : "";
  const hostSuffix = getIsolatedHtmlHostSuffix(resolverEndpoint);
  const label =
    hostSuffix && ref.protocol === "ipfs" ? toCidV1Base32Label(ref.id) : null;
  if (!hostSuffix || !label) {
    return `${to6529ResolverUrl(ref, resolverEndpoint)}${suffix}`;
  }

  const path = splitPath(ref.path).map(encodePathSegment).join("/");
  return `https://${label}${hostSuffix}/${path}${suffix}`;
}

/** Whether `hostname` is a path host of the app's own media resolver. */
export function isFirstPartyMediaResolverHostname(hostname: string): boolean {
  return FIRST_PARTY_MEDIA_RESOLVER_SET.has(
    canonicalizeGatewayHostname(hostname)
  );
}

/** Whether `hostname` is a media host of the separate content domain. */
export function isContentDomainMediaHostname(hostname: string): boolean {
  const normalized = canonicalizeGatewayHostname(hostname);
  return (
    normalized === USER_CONTENT_MEDIA_HOST ||
    isUserContentIpfsHostname(normalized)
  );
}

/**
 * Whether `hostname` belongs to the app's own media gateway on either domain:
 * the path hosts, the older 6529.io gateway names, or a per-CID host.
 */
export function isFirstPartyMediaHostname(hostname: string): boolean {
  const normalized = canonicalizeGatewayHostname(hostname);
  return (
    FIRST_PARTY_MEDIA_HOST_SET.has(normalized) ||
    isUserContentIpfsHostname(normalized)
  );
}

/**
 * Rewrites a first-party media URL (either domain) or a native `ipfs://`,
 * `ipns://` or `ar://` URI to the URL that frames or opens it as HTML,
 * keeping its query and hash. Returns `input` unchanged when the configured
 * resolver has no per-CID hosts, and for every other URL.
 */
export function toIsolatedHtmlUrlFromInput(
  input: string,
  resolverEndpoint: string | undefined
): string {
  if (!hasIsolatedHtmlHosts(resolverEndpoint)) {
    return input;
  }

  const trimmed = input.trim();
  const ref = parseDecentralizedMediaRef(trimmed);
  if (!ref) {
    return input;
  }

  if (parseNativeUri(trimmed)) {
    const suffixStart = findFirstIndex(trimmed, ["?", "#"]);
    return toIsolatedHtmlUrl(
      ref,
      resolverEndpoint,
      suffixStart < 0 ? "" : trimmed.slice(suffixStart)
    );
  }

  const url = parseHttpUrl(trimmed);
  if (url?.protocol !== "https:" || !isFirstPartyMediaHostname(url.hostname)) {
    return input;
  }

  return toIsolatedHtmlUrl(ref, resolverEndpoint, `${url.search}${url.hash}`);
}

function isUserContentIpfsHostname(normalizedHostname: string): boolean {
  return (
    normalizedHostname.endsWith(USER_CONTENT_IPFS_HOST_SUFFIX) &&
    normalizedHostname.length > USER_CONTENT_IPFS_HOST_SUFFIX.length &&
    !normalizedHostname
      .slice(0, -USER_CONTENT_IPFS_HOST_SUFFIX.length)
      .includes(".")
  );
}

function resolveDecentralizedMediaInput(
  input: string,
  options: ResolveDecentralizedMediaOptions
): DecentralizedMediaResolution {
  const parsed = parseDecentralizedMedia(input);
  if (!parsed) {
    return {
      input,
      recognized: false,
      external_fallback_urls: [],
      warnings: getUnrecognizedWarnings(input),
    };
  }

  return {
    input,
    recognized: true,
    protocol: parsed.ref.protocol,
    native_uri: toNativeUri(parsed.ref),
    id: parsed.ref.id,
    path: parsed.ref.path,
    resolver_url: to6529ResolverUrl(parsed.ref, options.resolverEndpoint),
    external_fallback_urls:
      options.includeExternalFallbacks === false
        ? []
        : toExternalFallbackUrls(parsed.ref, options.resolverEndpoint),
    warnings: parsed.warnings,
  };
}

function parseDecentralizedMedia(
  input: string | null | undefined
): ParsedDecentralizedMedia | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const native = parseNativeUri(trimmed);
  if (native) return native;

  const url = parseHttpUrl(trimmed);
  if (!url) {
    return looksLikeIpfsCid(trimmed)
      ? { ref: { protocol: "ipfs", id: trimmed, path: "" }, warnings: [] }
      : null;
  }

  return (
    parse6529ResolverUrl(url) ??
    parseIpfsPathGatewayUrl(url) ??
    parseIpfsSubdomainGatewayUrl(url) ??
    parseArweaveGatewayUrl(url) ??
    parseArweaveTxSubdomainUrl(url)
  );
}

function parseNativeUri(input: string): ParsedDecentralizedMedia | null {
  const protocolMatch = /^(ipfs|ipns|ar):\/\/(.+)$/i.exec(input);
  if (!protocolMatch?.[1] || !protocolMatch[2]) return null;

  const protocol =
    protocolMatch[1].toLowerCase() === "ar"
      ? "arweave"
      : (protocolMatch[1].toLowerCase() as DecentralizedMediaProtocol);
  const { value, warnings } = stripQueryAndHash(protocolMatch[2]);
  const parts = splitPath(value);
  const maybeId = parts[0] ?? "";

  if (
    protocol === "ipfs" &&
    maybeId.toLowerCase() === "ipfs" &&
    parts.length > 1
  ) {
    return makeParsed(protocol, parts[1] ?? "", parts.slice(2), warnings);
  }

  if (
    protocol === "ipns" &&
    maybeId.toLowerCase() === "ipns" &&
    parts.length > 1
  ) {
    return makeParsed(protocol, parts[1] ?? "", parts.slice(2), warnings);
  }

  return makeParsed(protocol, maybeId, parts.slice(1), warnings);
}

function parse6529ResolverUrl(url: URL): ParsedDecentralizedMedia | null {
  if (!isFirstPartyMediaResolverHostname(url.hostname)) {
    return null;
  }

  const parts = splitPath(url.pathname);
  const prefix = (parts[0] ?? "").toLowerCase();
  if (prefix !== "ipfs" && prefix !== "ipns" && prefix !== "arweave") {
    return null;
  }

  const protocol = prefix === "arweave" ? "arweave" : prefix;
  return makeParsed(
    protocol,
    parts[1] ?? "",
    parts.slice(2),
    getUrlWarnings(url)
  );
}

function parseIpfsPathGatewayUrl(url: URL): ParsedDecentralizedMedia | null {
  if (!IPFS_PATH_GATEWAY_SET.has(canonicalizeGatewayHostname(url.hostname))) {
    return null;
  }

  const parts = splitPath(url.pathname);
  const prefixIndex = parts.findIndex(
    (part) => part.toLowerCase() === "ipfs" || part.toLowerCase() === "ipns"
  );
  if (prefixIndex < 0) return null;

  const prefix = parts[prefixIndex];
  if (!prefix) return null;

  const protocol = prefix.toLowerCase() as "ipfs" | "ipns";
  return makeParsed(
    protocol,
    parts[prefixIndex + 1] ?? "",
    parts.slice(prefixIndex + 2),
    getUrlWarnings(url)
  );
}

function parseIpfsSubdomainGatewayUrl(
  url: URL
): ParsedDecentralizedMedia | null {
  const hostname = canonicalizeGatewayHostname(url.hostname);
  const suffix = IPFS_SUBDOMAIN_INPUT_SUFFIXES.find((candidate) =>
    hostname.endsWith(candidate)
  );
  if (!suffix) return null;

  const cid = hostname.slice(0, -suffix.length);
  const pathParts = splitPath(url.pathname);
  const own = makeParsed("ipfs", cid, pathParts, getUrlWarnings(url));
  // The host label must itself be a CID before any path is considered.
  if (!own) return null;

  // A per-CID host of the content domain serves `/ipfs/<cid>/…` (exact,
  // lower-case segment) from that other CID: absolute paths in art made for
  // path gateways. Any other path is served from the host's own CID.
  const nestedCid = pathParts[1];
  const nested =
    suffix === USER_CONTENT_IPFS_HOST_SUFFIX &&
    pathParts[0] === "ipfs" &&
    nestedCid &&
    looksLikeIpfsCid(nestedCid)
      ? makeParsed("ipfs", nestedCid, pathParts.slice(2), getUrlWarnings(url))
      : null;
  return nested ?? own;
}

function parseArweaveGatewayUrl(url: URL): ParsedDecentralizedMedia | null {
  if (!ARWEAVE_GATEWAY_SET.has(canonicalizeGatewayHostname(url.hostname))) {
    return null;
  }

  const parts = splitPath(url.pathname);
  return makeParsed(
    "arweave",
    parts[0] ?? "",
    parts.slice(1),
    getUrlWarnings(url)
  );
}

function parseArweaveTxSubdomainUrl(url: URL): ParsedDecentralizedMedia | null {
  const hostname = canonicalizeGatewayHostname(url.hostname);
  const suffix = ARWEAVE_TX_SUBDOMAIN_SUFFIXES.find((candidate) =>
    hostname.endsWith(candidate)
  );
  if (!suffix) return null;

  const txid = hostname.slice(0, -suffix.length);
  const pathParts = splitPath(url.pathname);
  // Tx subdomain hosts are canonicalized to lowercase; v1 keeps path casing
  // exact, so only duplicate lowercase txid path prefixes are stripped.
  const normalizedPathParts =
    pathParts[0] === txid ? pathParts.slice(1) : pathParts;
  return makeParsed("arweave", txid, normalizedPathParts, getUrlWarnings(url));
}

function makeParsed(
  protocol: DecentralizedMediaProtocol,
  id: string,
  pathParts: readonly string[],
  warnings: readonly string[]
): ParsedDecentralizedMedia | null {
  const normalizedId = id.trim();
  if (!isValidIdSegment(normalizedId)) return null;
  if (!isValidProtocolId(protocol, normalizedId)) return null;

  return {
    ref: {
      protocol,
      id: normalizedId,
      path: normalizePath(pathParts),
    },
    warnings: [...warnings],
  };
}

function splitPath(path: string): string[] {
  return path
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function normalizePath(pathParts: readonly string[]): string {
  return pathParts.map(encodePathSegment).join("/");
}

function buildPath(id: string, path: string): string {
  const normalizedPath = splitPath(path).map(encodePathSegment).join("/");
  if (!normalizedPath) return encodePathSegment(id);
  return `${encodePathSegment(id)}/${normalizedPath}`;
}

function buildSubdomainUrl(
  id: string,
  hostSuffix: string,
  path: string
): string {
  const normalizedPath = splitPath(path).map(encodePathSegment).join("/");
  return normalizedPath
    ? `https://${encodePathSegment(id)}.${hostSuffix}/${normalizedPath}`
    : `https://${encodePathSegment(id)}.${hostSuffix}`;
}

function normalizeOrigin(origin: string): string {
  let end = origin.length;
  while (end > 0 && origin.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return origin.slice(0, end);
}

function parseHttpUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function stripQueryAndHash(value: string): {
  readonly value: string;
  readonly warnings: string[];
} {
  const index = findFirstIndex(value, ["?", "#"]);
  if (index < 0) return { value, warnings: [] };
  return {
    value: value.slice(0, index),
    warnings: ["query_or_hash_stripped"],
  };
}

function getUrlWarnings(url: URL): string[] {
  return url.search || url.hash ? ["query_or_hash_stripped"] : [];
}

function getUnrecognizedWarnings(input: string): string[] {
  const trimmed = input.trim();
  if (trimmed === "") return ["invalid_url"];
  if (/^https?:\/\//i.exec(trimmed)) {
    return parseHttpUrl(trimmed) ? [] : ["invalid_url"];
  }
  const schemeMatch = /^([a-z][a-z0-9+.-]*):\/\//i.exec(trimmed);
  if (schemeMatch?.[1]) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === "ipfs" || scheme === "ipns" || scheme === "ar") {
      return ["invalid_url"];
    }
    return ["unsupported_scheme"];
  }
  if (trimmed.includes("://")) return ["invalid_url"];
  return [];
}

function findFirstIndex(value: string, needles: readonly string[]): number {
  const indexes = needles
    .map((needle) => value.indexOf(needle))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);
  return indexes[0] ?? -1;
}

function encodePathSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

function isValidIdSegment(value: string): boolean {
  return value.length > 0 && !/[\s/?#]/.exec(value);
}

function isValidProtocolId(
  protocol: DecentralizedMediaProtocol,
  value: string
): boolean {
  if (protocol === "ipfs") return looksLikeIpfsCid(value);
  if (protocol === "arweave") return looksLikeArweaveTxId(value);
  return true;
}

function looksLikeIpfsCid(value: string): boolean {
  // Supports CIDv0 base58btc and CIDv1 base32; other CIDv1 multibase
  // encodings are intentionally outside this resolver v1 allowlist.
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|[bB][aA][fF][a-zA-Z2-7]{20,})$/.test(
    value
  );
}

function looksLikeArweaveTxId(value: string): boolean {
  return ARWEAVE_TX_ID_PATTERN.test(value);
}

function isDnsSafeSubdomainId(value: string): boolean {
  return DNS_SAFE_LABEL_PATTERN.test(value);
}

function dedupe(list: readonly string[]): string[] {
  return Array.from(new Set(list));
}
