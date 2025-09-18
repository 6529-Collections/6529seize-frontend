import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { toASCII } from "node:punycode";

import type {
  GoogleDocsLinkPreview,
  GoogleSheetsLinkPreview,
  GoogleSlidesLinkPreview,
  GoogleWorkspaceLinkPreview,
  LinkPreviewResponse,
} from "@/services/api/link-preview-api";

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

export const LINK_PREVIEW_USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";

const GOOGLE_DOCS_HOST = "docs.google.com";
const GOOGLE_THUMBNAIL_BASE = "https://drive.google.com/thumbnail";
const GOOGLE_PREVIEW_TIMEOUT_MS = 3000;
const GOOGLE_PREVIEW_BYTE_LIMIT = 64 * 1024;
const GOOGLE_TITLE_MAX_LENGTH = 160;

type GoogleWorkspaceKind = "docs" | "sheets" | "slides";

const GOOGLE_RESOURCE_KIND: Record<string, GoogleWorkspaceKind | undefined> = {
  document: "docs",
  spreadsheets: "sheets",
  presentation: "slides",
};

const GOOGLE_TYPE_INFO: Record<
  GoogleWorkspaceKind,
  {
    readonly type: GoogleWorkspaceLinkPreview["type"];
    readonly label: string;
    readonly fallbackTitle: string;
    readonly resource: string;
  }
> = {
  docs: {
    type: "google.docs",
    label: "Google Docs",
    fallbackTitle: "Untitled Doc",
    resource: "document",
  },
  sheets: {
    type: "google.sheets",
    label: "Google Sheets",
    fallbackTitle: "Untitled Sheet",
    resource: "spreadsheets",
  },
  slides: {
    type: "google.slides",
    label: "Google Slides",
    fallbackTitle: "Untitled Slides",
    resource: "presentation",
  },
};

type GoogleWorkspaceAvailability = GoogleWorkspaceLinkPreview["availability"];

interface GoogleWorkspaceNormalization {
  readonly kind: GoogleWorkspaceKind;
  readonly fileId: string;
  readonly canonicalBase: string;
  readonly gid?: string;
  readonly range?: string;
  readonly widget?: string;
  readonly headers?: string;
  readonly chrome?: string;
  readonly isPublished: boolean;
}

const GOOGLE_ACCESS_DENIED_PATTERNS = [
  "you need permission",
  "request access",
  "sign in to continue",
  "sign in - google accounts",
  "accounts.google.com/signin",
  "ask for access",
  "this document is unavailable",
  "this presentation is unavailable",
  "this file is not available",
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

function parseHashParams(hash: string): URLSearchParams {
  if (!hash) {
    return new URLSearchParams();
  }

  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(normalized);
}

function normalizeGoogleWorkspaceUrl(
  url: URL
): GoogleWorkspaceNormalization | null {
  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== GOOGLE_DOCS_HOST) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3) {
    return null;
  }

  const [resource, marker, fileId, ...rest] = segments;
  if (marker !== "d" || !fileId) {
    return null;
  }

  const kind = GOOGLE_RESOURCE_KIND[resource.toLowerCase()];
  if (!kind) {
    return null;
  }

  const canonicalBase = `https://${GOOGLE_DOCS_HOST}/${resource.toLowerCase()}/d/${fileId}`;
  const searchParams = url.searchParams;
  const hashParams = parseHashParams(url.hash);

  const gid = searchParams.get("gid") ?? hashParams.get("gid") ?? undefined;
  const range = searchParams.get("range") ?? hashParams.get("range") ?? undefined;
  const widget = searchParams.get("widget") ?? undefined;
  const headers = searchParams.get("headers") ?? undefined;
  const chrome = searchParams.get("chrome") ?? undefined;

  const isPublished =
    rest.some((segment) => segment.toLowerCase().startsWith("pub")) ||
    searchParams.get("output") === "html" ||
    widget !== undefined ||
    headers !== undefined ||
    chrome !== undefined;

  return {
    kind,
    fileId,
    canonicalBase,
    gid: gid && gid.length > 0 ? gid : undefined,
    range: range && range.length > 0 ? range : undefined,
    widget: widget && widget.length > 0 ? widget : undefined,
    headers: headers && headers.length > 0 ? headers : undefined,
    chrome: chrome && chrome.length > 0 ? chrome : undefined,
    isPublished,
  };
}

function buildSheetsPreviewUrl(
  base: string,
  gid: string,
  range?: string
): string {
  const preview = new URL(`${base}/htmlview`);
  preview.searchParams.set("gid", gid);
  if (range) {
    preview.searchParams.set("range", range);
  }
  return preview.toString();
}

function buildSheetsEmbedUrl(
  normalization: GoogleWorkspaceNormalization,
  gid: string
): string {
  const embed = new URL(`${normalization.canonicalBase}/pubhtml`);
  embed.searchParams.set("widget", normalization.widget ?? "true");
  embed.searchParams.set("headers", normalization.headers ?? "false");
  embed.searchParams.set("gid", gid);
  if (normalization.range) {
    embed.searchParams.set("range", normalization.range);
  }
  if (normalization.chrome) {
    embed.searchParams.set("chrome", normalization.chrome);
  }
  return embed.toString();
}

function buildGoogleThumbnailUrl(fileId: string): string {
  return `${GOOGLE_THUMBNAIL_BASE}?id=${encodeURIComponent(fileId)}&sz=w1000`;
}

function clampGoogleTitle(
  value: string | undefined | null,
  fallback: string
): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  const base = trimmed.length > 0 ? trimmed : fallback;
  if (base.length <= GOOGLE_TITLE_MAX_LENGTH) {
    return base;
  }
  return `${base.slice(0, GOOGLE_TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

function isGoogleAccessRestricted(html: string | null | undefined): boolean {
  if (!html) {
    return false;
  }

  const normalized = html.toLowerCase();
  return GOOGLE_ACCESS_DENIED_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

async function readLimitedResponse(
  response: Response,
  byteLimit: number
): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    return text.length > byteLimit ? text.slice(0, byteLimit) : text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let total = 0;

  while (total < byteLimit) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (value) {
      total += value.byteLength;
      result += decoder.decode(value, { stream: true });

      if (total >= byteLimit) {
        try {
          await reader.cancel();
        } catch {
          // ignore cancellation errors
        }
        break;
      }
    }
  }

  result += decoder.decode();

  if (result.length > byteLimit) {
    return result.slice(0, byteLimit);
  }

  return result;
}

async function fetchGooglePreviewHtml(url: string): Promise<{
  html: string | null;
  ok: boolean;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_PREVIEW_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": LINK_PREVIEW_USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { html: null, ok: false };
    }

    const html = await readLimitedResponse(response, GOOGLE_PREVIEW_BYTE_LIMIT);
    return { html, ok: true };
  } catch {
    return { html: null, ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

function deriveGoogleAvailability(
  previewResult: { html: string | null; ok: boolean },
  initialHtml: string
): GoogleWorkspaceAvailability {
  if (!previewResult.ok) {
    return "restricted";
  }

  if (
    isGoogleAccessRestricted(previewResult.html) ||
    isGoogleAccessRestricted(initialHtml)
  ) {
    return "restricted";
  }

  return "public";
}

function pickGoogleTitle(
  previewHtml: string | null,
  initialHtml: string,
  fallback: string
): string {
  const candidates: Array<string | undefined> = [];

  if (previewHtml) {
    candidates.push(extractFirstMetaContent(previewHtml, TITLE_KEYS));
    candidates.push(extractTitleTag(previewHtml));
  }

  if (initialHtml) {
    candidates.push(extractFirstMetaContent(initialHtml, TITLE_KEYS));
    candidates.push(extractTitleTag(initialHtml));
  }

  const selected = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  return clampGoogleTitle(selected, fallback);
}

export async function buildGoogleWorkspaceResponse(
  resolvedUrl: URL,
  html: string,
  requestUrl: URL
): Promise<GoogleWorkspaceLinkPreview | null> {
  const normalization = normalizeGoogleWorkspaceUrl(resolvedUrl);
  if (!normalization) {
    return null;
  }

  const info = GOOGLE_TYPE_INFO[normalization.kind];
  const thumbnail = buildGoogleThumbnailUrl(normalization.fileId);

  if (normalization.kind === "docs") {
    const openUrl = `${normalization.canonicalBase}/edit`;
    const previewUrl = `${normalization.canonicalBase}/preview`;
    const preview = await fetchGooglePreviewHtml(previewUrl);
    const availability = deriveGoogleAvailability(preview, html);
    const extractedTitle = pickGoogleTitle(
      preview.html,
      html,
      info.fallbackTitle
    );
    const resolvedTitle =
      availability === "restricted" ? info.fallbackTitle : extractedTitle;

    const response: GoogleDocsLinkPreview = {
      type: "google.docs",
      requestUrl: requestUrl.toString(),
      url: openUrl,
      title: resolvedTitle,
      description: null,
      siteName: info.label,
      mediaType: null,
      contentType: null,
      favicon: null,
      favicons: [],
      image: null,
      images: [],
      thumbnail,
      fileId: normalization.fileId,
      availability,
      links: {
        open: openUrl,
        preview: previewUrl,
        exportPdf: `${normalization.canonicalBase}/export?format=pdf`,
      },
    };

    return response;
  }

  if (normalization.kind === "slides") {
    const openUrl = `${normalization.canonicalBase}/edit`;
    const previewUrl = `${normalization.canonicalBase}/preview`;
    const preview = await fetchGooglePreviewHtml(previewUrl);
    const availability = deriveGoogleAvailability(preview, html);
    const extractedTitle = pickGoogleTitle(
      preview.html,
      html,
      info.fallbackTitle
    );
    const resolvedTitle =
      availability === "restricted" ? info.fallbackTitle : extractedTitle;

    const response: GoogleSlidesLinkPreview = {
      type: "google.slides",
      requestUrl: requestUrl.toString(),
      url: openUrl,
      title: resolvedTitle,
      description: null,
      siteName: info.label,
      mediaType: null,
      contentType: null,
      favicon: null,
      favicons: [],
      image: null,
      images: [],
      thumbnail,
      fileId: normalization.fileId,
      availability,
      links: {
        open: openUrl,
        preview: previewUrl,
        exportPdf: `${normalization.canonicalBase}/export/pdf`,
      },
    };

    return response;
  }

  const resolvedGid = normalization.gid ?? "0";
  const openUrl = `${normalization.canonicalBase}/edit#gid=${resolvedGid}`;
  const previewUrl = buildSheetsPreviewUrl(
    normalization.canonicalBase,
    resolvedGid,
    normalization.range
  );
  const preview = await fetchGooglePreviewHtml(previewUrl);
  const availability = deriveGoogleAvailability(preview, html);
  const extractedTitle = pickGoogleTitle(
    preview.html,
    html,
    info.fallbackTitle
  );
  const resolvedTitle =
    availability === "restricted" ? info.fallbackTitle : extractedTitle;
  const embedPub = normalization.isPublished
    ? buildSheetsEmbedUrl(normalization, resolvedGid)
    : undefined;

  const response: GoogleSheetsLinkPreview = {
    type: "google.sheets",
    requestUrl: requestUrl.toString(),
    url: openUrl,
    title: resolvedTitle,
    description: null,
    siteName: info.label,
    mediaType: null,
    contentType: null,
    favicon: null,
    favicons: [],
    image: null,
    images: [],
    thumbnail,
    fileId: normalization.fileId,
    availability,
    gid: resolvedGid,
    links: {
      open: openUrl,
      preview: previewUrl,
      ...(embedPub ? { embedPub } : {}),
    },
  };

  return response;
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

  return parsed;
}
