import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { toASCII } from "node:punycode";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

const TITLE_KEYS = ["og:title", "twitter:title", "title"] as const;
const DESCRIPTION_KEYS = [
  "og:description",
  "twitter:description",
  "description",
] as const;
const SITE_NAME_KEYS = ["og:site_name", "application-name"] as const;
const URL_KEYS = ["og:url"] as const;
const TYPE_KEYS = ["og:type"] as const;
const IMAGE_KEYS = [
  "og:image",
  "og:image:url",
  "twitter:image",
  "twitter:image:src",
] as const;

const ESCAPE_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const iconRelPattern = /icon/i;

const DISALLOWED_HOST_PATTERNS = ["localhost", "127.0.0.1", "::1"];

const PRIVATE_IPV4_RANGES: ReadonlyArray<[number, number]> = [
  [ipv4ToInt("0.0.0.0"), ipv4ToInt("0.255.255.255")],
  [ipv4ToInt("10.0.0.0"), ipv4ToInt("10.255.255.255")],
  [ipv4ToInt("100.64.0.0"), ipv4ToInt("100.127.255.255")],
  [ipv4ToInt("127.0.0.0"), ipv4ToInt("127.255.255.255")],
  [ipv4ToInt("169.254.0.0"), ipv4ToInt("169.254.255.255")],
  [ipv4ToInt("172.16.0.0"), ipv4ToInt("172.31.255.255")],
  [ipv4ToInt("192.0.0.0"), ipv4ToInt("192.0.0.255")],
  [ipv4ToInt("192.0.2.0"), ipv4ToInt("192.0.2.255")],
  [ipv4ToInt("192.168.0.0"), ipv4ToInt("192.168.255.255")],
  [ipv4ToInt("198.18.0.0"), ipv4ToInt("198.19.255.255")],
  [ipv4ToInt("198.51.100.0"), ipv4ToInt("198.51.100.255")],
  [ipv4ToInt("203.0.113.0"), ipv4ToInt("203.0.113.255")],
  [ipv4ToInt("224.0.0.0"), ipv4ToInt("239.255.255.255")],
  [ipv4ToInt("240.0.0.0"), ipv4ToInt("255.255.255.255")],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    if (entity.startsWith("#")) {
      const codePoint = parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    return ESCAPE_HTML_ENTITIES[entity] ?? "";
  });
}

function extractFirstMetaContent(
  html: string,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=['"]${escapeRegExp(key)}['"][^>]*content=['"]([^'"]+)['"][^>]*>`,
      "i"
    );
    const match = pattern.exec(html);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }
  return undefined;
}

function extractAllMetaContent(
  html: string,
  keys: readonly string[]
): string[] {
  const results = new Set<string>();

  for (const key of keys) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=['"]${escapeRegExp(key)}['"][^>]*content=['"]([^'"]+)['"][^>]*>`,
      "gi"
    );
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      if (match[1]) {
        results.add(decodeHtmlEntities(match[1].trim()));
      }
    }
  }

  return Array.from(results);
}

function extractTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match && match[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
}

function extractCanonicalUrl(html: string, baseUrl: URL): string | undefined {
  const pattern = /<link[^>]*rel=['"]canonical['"][^>]*href=['"]([^'"]+)['"][^>]*>/i;
  const match = pattern.exec(html);
  if (match && match[1]) {
    return resolveUrl(baseUrl, decodeHtmlEntities(match[1].trim()));
  }
  return undefined;
}

function extractIconLinks(html: string, baseUrl: URL): string[] {
  const results = new Set<string>();
  const pattern = /<link[^>]*rel=['"]([^'"]+)['"][^>]*href=['"]([^'"]+)['"][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    const rel = match[1];
    const href = match[2];
    if (rel && href && iconRelPattern.test(rel)) {
      const resolved = resolveUrl(baseUrl, decodeHtmlEntities(href.trim()));
      if (resolved) {
        results.add(resolved);
      }
    }
  }

  return Array.from(results);
}

function resolveUrl(baseUrl: URL, value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function ipv4ToInt(ip: string): number {
  const segments = ip.split(".").map((segment) => Number.parseInt(segment, 10));
  if (segments.length !== 4 || segments.some((segment) => Number.isNaN(segment))) {
    return -1;
  }

  return (
    (segments[0] << 24) +
    (segments[1] << 16) +
    (segments[2] << 8) +
    segments[3]
  ) >>> 0;
}

function isPrivateIpv4(address: string): boolean {
  const value = ipv4ToInt(address);

  if (value < 0) {
    return true;
  }

  return PRIVATE_IPV4_RANGES.some(([start, end]) => value >= start && value <= end);
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1" ||
    normalized === "::" ||
    normalized === "0:0:0:0:0:0:0:0"
  ) {
    return true;
  }

  const segments = normalized.split(":");
  const firstBlock = segments.find((segment) => segment.length > 0) ?? "";

  if (firstBlock.startsWith("fc") || firstBlock.startsWith("fd")) {
    return true;
  }

  if (
    firstBlock.startsWith("fe8") ||
    firstBlock.startsWith("fe9") ||
    firstBlock.startsWith("fea") ||
    firstBlock.startsWith("feb")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const mappedIpv4 = normalized.split("::ffff:")[1];
    if (mappedIpv4) {
      return isPrivateIpv4(mappedIpv4);
    }
  }

  return false;
}

function isForbiddenAddress(address: string): boolean {
  const ipType = isIP(address);

  if (ipType === 4) {
    return isPrivateIpv4(address);
  }

  if (ipType === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

function normalizeHostname(hostname: string): string {
  try {
    return toASCII(hostname.trim());
  } catch {
    return hostname.trim().toLowerCase();
  }
}

function isSuspiciousIpFormat(host: string): boolean {
  const lowerHost = host.toLowerCase();

  if (/^0x[0-9a-f]+$/i.test(lowerHost)) {
    return true;
  }

  if (/^0[0-7.]+$/.test(lowerHost)) {
    return true;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(lowerHost)) {
    const segments = lowerHost.split(".");
    return segments.some((segment) => segment.length > 1 && segment.startsWith("0"));
  }

  return false;
}

export async function ensureUrlIsPublic(url: URL): Promise<void> {
  let hostname = url.hostname;

  if (!hostname) {
    throw new Error("URL host is required.");
  }

  hostname = normalizeHostname(hostname);
  const lowerHost = hostname.toLowerCase();
  if (
    DISALLOWED_HOST_PATTERNS.some((pattern) => lowerHost === pattern) ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") ||
    isSuspiciousIpFormat(lowerHost) ||
    lowerHost.startsWith("::ffff:")
  ) {
    throw new Error("URL host is not allowed.");
  }

  if (isIP(hostname) !== 0) {
    if (isForbiddenAddress(hostname)) {
      throw new Error("IP addresses in this range are not allowed.");
    }
    return;
  }

  let lookupResults: readonly { address: string; family: number }[];
  try {
    lookupResults = await lookup(hostname, { all: true });
  } catch {
    throw new Error("Failed to resolve URL host.");
  }

  if (lookupResults.length === 0) {
    throw new Error("Failed to resolve URL host.");
  }

  const hasForbiddenAddress = lookupResults.some(({ address }) => {
    const resolvedAddress = address.toLowerCase();
    return isForbiddenAddress(resolvedAddress);
  });

  if (hasForbiddenAddress) {
    throw new Error("Resolved host is not reachable.");
  }
}

export function buildResponse(
  url: URL,
  html: string,
  contentType: string | null
): LinkPreviewResponse {
  const title =
    extractFirstMetaContent(html, TITLE_KEYS) ?? extractTitleTag(html);
  const description = extractFirstMetaContent(html, DESCRIPTION_KEYS);
  const siteName = extractFirstMetaContent(html, SITE_NAME_KEYS);
  const resolvedImageUrls = extractAllMetaContent(html, IMAGE_KEYS)
    .map((src) => resolveUrl(url, src))
    .filter((src): src is string => Boolean(src));
  const canonicalUrl =
    extractFirstMetaContent(html, URL_KEYS) ?? extractCanonicalUrl(html, url);
  const type = extractFirstMetaContent(html, TYPE_KEYS);
  const favicons = extractIconLinks(html, url);

  const primaryImage = resolvedImageUrls[0];

  return {
    requestUrl: url.toString(),
    url: canonicalUrl ?? url.toString(),
    title: title ?? null,
    description: description ?? null,
    siteName: siteName ?? null,
    mediaType: type ?? null,
    contentType: contentType ?? null,
    favicon: favicons[0] ?? null,
    favicons,
    image: primaryImage
      ? { url: primaryImage, secureUrl: primaryImage }
      : null,
    images: resolvedImageUrls.map((src) => ({ url: src, secureUrl: src })),
  };
}

// Hostname allowlist to prevent SSRF
const ALLOWED_HOSTNAMES = [
  "example.com",
  "twitter.com",
  "6529.io"
];

export function isAllowedHostname(url: URL): boolean {
  // You may want to normalize hostnames, lowercasing, etc.
  // For subdomains, you can check: host.endsWith('.example.com')
  const hostname = url.hostname.toLowerCase();
  return ALLOWED_HOSTNAMES.some(allowed =>
    hostname === allowed ||
    hostname.endsWith("." + allowed)
  );
}

export function validateUrl(url: string | null): URL {
  if (!url) {
    throw new Error("A url query parameter is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("The provided url parameter is not a valid URL.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error("Only HTTP(S) URLs are supported.");
  }

  if (!isAllowedHostname(parsed)) {
    throw new Error("The provided URL's hostname is not allowed.");
  }

  return parsed;
}
