import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { load } from "cheerio";
import { buildGoogleWorkspaceResponse } from "./googleWorkspace";

export { buildGoogleWorkspaceResponse } from "./googleWorkspace";

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
  "og:image:secure_url",
  "twitter:image",
  "twitter:image:src",
] as const;
const AUTHOR_KEYS = [
  "author",
  "article:author",
  "twitter:creator",
  "parsely-author",
  "sailthru.author",
  "dc.creator",
] as const;
const PUBLISHED_TIME_KEYS = [
  "article:published_time",
  "date",
  "datePublished",
  "datepublished",
  "pubdate",
  "publishdate",
] as const;
const MODIFIED_TIME_KEYS = [
  "article:modified_time",
  "og:updated_time",
  "dateModified",
  "datemodified",
] as const;
const ARTICLE_SECTION_KEYS = ["article:section"] as const;

export const HTML_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

const iconRelPattern = /icon/i;

export const LINK_PREVIEW_USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";

const JSON_LD_SCRIPT_MAX_CHARS = 128 * 1024;
const JSON_LD_MAX_NODES = 64;
const JSON_LD_MAX_DEPTH = 8;
const JSON_LD_IMAGE_MAX_CANDIDATES = 16;

type LoadedHtml = ReturnType<typeof load>;

function normalizeWhitespace(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function getMetaIdentifier(
  $: LoadedHtml,
  element: unknown
): string | undefined {
  const tag = $(element);
  return normalizeWhitespace(
    tag.attr("property") ?? tag.attr("name") ?? tag.attr("itemprop")
  )?.toLowerCase();
}

function collectMetaContent(
  $: LoadedHtml,
  keys: readonly string[]
): Map<string, string[]> {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const results = new Map<string, string[]>();

  $("meta").each((_index: number, element: unknown) => {
    const identifier = getMetaIdentifier($, element);
    if (!identifier || !keySet.has(identifier)) {
      return;
    }

    const content = normalizeWhitespace($(element).attr("content"));
    if (!content) {
      return;
    }

    const values = results.get(identifier) ?? [];
    values.push(content);
    results.set(identifier, values);
  });

  return results;
}

export function extractFirstMetaContent(
  $: LoadedHtml,
  keys: readonly string[]
): string | undefined {
  const metadata = collectMetaContent($, keys);
  for (const key of keys) {
    const [first] = metadata.get(key.toLowerCase()) ?? [];
    if (first) {
      return first;
    }
  }
  return undefined;
}

export function extractTitleTag($: LoadedHtml): string | undefined {
  return normalizeWhitespace($("title").first().text());
}

function extractCanonicalUrl($: LoadedHtml, baseUrl: URL): string | undefined {
  const href = normalizeWhitespace(
    $('link[rel~="canonical"]').first().attr("href")
  );
  return resolveUrl(baseUrl, href);
}

function iconPreferenceScore(rel: string, href: string): number {
  const normalizedRel = rel.toLowerCase();
  const normalizedHref = href.toLowerCase();
  if (normalizedRel.includes("shortcut icon")) {
    return 4;
  }
  if (/\bicon\b/.test(normalizedRel) && !normalizedRel.includes("apple")) {
    return 3;
  }
  if (normalizedHref.endsWith(".svg")) {
    return 2;
  }
  if (normalizedRel.includes("apple-touch-icon")) {
    return 1;
  }
  return 0;
}

function extractIconLinks($: LoadedHtml, baseUrl: URL): string[] {
  const byUrl = new Map<string, number>();

  $("link").each((_index: number, element: unknown) => {
    const tag = $(element);
    const rel = normalizeWhitespace(tag.attr("rel")) ?? "";
    const href = normalizeWhitespace(tag.attr("href"));
    if (!href || !iconRelPattern.test(rel)) {
      return;
    }

    const resolved = resolveUrl(baseUrl, href);
    if (!resolved) {
      return;
    }

    byUrl.set(resolved, iconPreferenceScore(rel, href));
  });

  return Array.from(byUrl.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url);
}

function resolveUrl(
  baseUrl: URL,
  value: string | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

type JsonLdNode = Record<string, unknown>;
type ImageCandidate = {
  readonly url: string;
  readonly source: "json-ld" | "og" | "twitter";
};

function safeParseJsonLd(raw: string): unknown {
  if (raw.length > JSON_LD_SCRIPT_MAX_CHARS) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): JsonLdNode | null {
  return typeof value === "object" && value !== null
    ? (value as JsonLdNode)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? normalizeWhitespace(value) : undefined;
}

function flattenJsonLdNodes(
  value: unknown,
  depth = 0,
  budget: { remaining: number } = { remaining: JSON_LD_MAX_NODES }
): JsonLdNode[] {
  if (depth > JSON_LD_MAX_DEPTH || budget.remaining <= 0) {
    return [];
  }

  if (Array.isArray(value)) {
    const nodes: JsonLdNode[] = [];
    for (const entry of value) {
      nodes.push(...flattenJsonLdNodes(entry, depth + 1, budget));
      if (budget.remaining <= 0) {
        break;
      }
    }
    return nodes;
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  budget.remaining -= 1;
  const graph = record["@graph"];
  const nodes = [record];

  if (Array.isArray(graph) && budget.remaining > 0) {
    for (const entry of graph) {
      nodes.push(...flattenJsonLdNodes(entry, depth + 1, budget));
      if (budget.remaining <= 0) {
        break;
      }
    }
  }

  return nodes;
}

function getJsonLdType(node: JsonLdNode): string {
  const type = node["@type"];
  if (Array.isArray(type)) {
    return type.map((entry) => String(entry).toLowerCase()).join(" ");
  }
  return typeof type === "string" ? type.toLowerCase() : "";
}

function pickJsonLdNode(nodes: readonly JsonLdNode[]): JsonLdNode | null {
  return (
    nodes.find((node) =>
      /\b(article|newsarticle|blogposting|report|creativework)\b/.test(
        getJsonLdType(node)
      )
    ) ??
    nodes.find((node) => /\b(webpage|website)\b/.test(getJsonLdType(node))) ??
    nodes[0] ??
    null
  );
}

function extractJsonLdNodes($: LoadedHtml): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];

  $('script[type="application/ld+json"]').each(
    (_index: number, element: unknown) => {
      const parsed = safeParseJsonLd($(element).contents().text());
      nodes.push(...flattenJsonLdNodes(parsed));
    }
  );

  return nodes;
}

function extractJsonLdImage(
  node: JsonLdNode | null,
  baseUrl: URL,
  depth = 0,
  budget: { remaining: number } = { remaining: JSON_LD_IMAGE_MAX_CANDIDATES }
): string | undefined {
  if (!node || depth > JSON_LD_MAX_DEPTH || budget.remaining <= 0) {
    return undefined;
  }

  // The shared budget limits candidate nodes across nested JSON-LD image arrays.
  const candidate = node["image"] ?? node["thumbnailUrl"] ?? node["thumbnail"];
  if (typeof candidate === "string") {
    budget.remaining -= 1;
    return resolveUrl(baseUrl, candidate);
  }

  if (Array.isArray(candidate)) {
    for (const entry of candidate) {
      const image = extractJsonLdImage(
        { image: entry },
        baseUrl,
        depth + 1,
        budget
      );
      if (image) {
        return image;
      }
      if (budget.remaining <= 0) {
        break;
      }
    }
  }

  const record = asRecord(candidate);
  if (record) {
    budget.remaining -= 1;
  }
  return resolveUrl(
    baseUrl,
    asString(record?.["url"]) ?? asString(record?.["contentUrl"])
  );
}

function extractJsonLdAuthor(node: JsonLdNode | null): string | undefined {
  const author = node?.["author"] ?? node?.["creator"];
  if (typeof author === "string") {
    return normalizeWhitespace(author);
  }

  if (Array.isArray(author)) {
    const names = author
      .map((entry) => asString(asRecord(entry)?.["name"]) ?? asString(entry))
      .filter((name): name is string => Boolean(name));
    return names.length > 0 ? names.join(", ") : undefined;
  }

  return asString(asRecord(author)?.["name"]);
}

function getImageSource(key: string): ImageCandidate["source"] {
  return key.toLowerCase().startsWith("twitter:") ? "twitter" : "og";
}

function extractImageCandidates(
  $: LoadedHtml,
  baseUrl: URL,
  jsonLdImage: string | undefined
): ImageCandidate[] {
  const imageMetadata = collectMetaContent($, IMAGE_KEYS);
  const byUrl = new Map<string, ImageCandidate>();

  for (const key of IMAGE_KEYS) {
    for (const value of imageMetadata.get(key.toLowerCase()) ?? []) {
      const resolved = resolveUrl(baseUrl, value);
      if (!resolved || byUrl.has(resolved)) {
        continue;
      }

      byUrl.set(resolved, {
        url: resolved,
        source: getImageSource(key),
      });
    }
  }

  if (jsonLdImage && !byUrl.has(jsonLdImage)) {
    byUrl.set(jsonLdImage, {
      url: jsonLdImage,
      source: "json-ld",
    });
  }

  return Array.from(byUrl.values());
}

function extractImageMetadataForSource(
  $: LoadedHtml,
  source: ImageCandidate["source"] | undefined
): {
  readonly alt?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
} {
  if (source === "json-ld" || !source) {
    return {};
  }

  const keys =
    source === "twitter"
      ? {
          alt: ["twitter:image:alt"] as const,
          width: ["twitter:image:width"] as const,
          height: ["twitter:image:height"] as const,
        }
      : {
          alt: ["og:image:alt"] as const,
          width: ["og:image:width"] as const,
          height: ["og:image:height"] as const,
        };

  return {
    alt: extractFirstMetaContent($, keys.alt),
    width: parsePositiveInteger(extractFirstMetaContent($, keys.width)),
    height: parsePositiveInteger(extractFirstMetaContent($, keys.height)),
  };
}

export function buildResponse(
  url: URL,
  html: string,
  contentType: string | null,
  _finalUrl?: string
): LinkPreviewResponse {
  const $ = load(html);
  const jsonLdNode = pickJsonLdNode(extractJsonLdNodes($));
  const title =
    extractFirstMetaContent($, TITLE_KEYS) ??
    asString(jsonLdNode?.["headline"]) ??
    asString(jsonLdNode?.["name"]) ??
    extractTitleTag($);
  const description =
    extractFirstMetaContent($, DESCRIPTION_KEYS) ??
    asString(jsonLdNode?.["description"]);
  const siteName =
    extractFirstMetaContent($, SITE_NAME_KEYS) ??
    asString(asRecord(jsonLdNode?.["publisher"])?.["name"]);
  const jsonLdImage = extractJsonLdImage(jsonLdNode, url);
  const imageCandidates = extractImageCandidates($, url, jsonLdImage);
  const canonicalUrl =
    extractFirstMetaContent($, URL_KEYS) ?? extractCanonicalUrl($, url);
  const type = extractFirstMetaContent($, TYPE_KEYS);
  const favicons = extractIconLinks($, url);
  const author =
    extractFirstMetaContent($, AUTHOR_KEYS) ?? extractJsonLdAuthor(jsonLdNode);
  const publishedTime =
    extractFirstMetaContent($, PUBLISHED_TIME_KEYS) ??
    asString(jsonLdNode?.["datePublished"]);
  const modifiedTime =
    extractFirstMetaContent($, MODIFIED_TIME_KEYS) ??
    asString(jsonLdNode?.["dateModified"]);
  const section = extractFirstMetaContent($, ARTICLE_SECTION_KEYS);
  const primaryImage = imageCandidates[0];
  const primaryImageMetadata = extractImageMetadataForSource(
    $,
    primaryImage?.source
  );

  const primaryImageData = primaryImage
    ? {
        url: primaryImage.url,
        secureUrl: primaryImage.url,
        width: primaryImageMetadata.width ?? null,
        height: primaryImageMetadata.height ?? null,
        alt: primaryImageMetadata.alt ?? null,
      }
    : null;

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
    image: primaryImageData,
    images: imageCandidates.map((candidate, index) => ({
      url: candidate.url,
      secureUrl: candidate.url,
      width: index === 0 ? (primaryImageMetadata.width ?? null) : null,
      height: index === 0 ? (primaryImageMetadata.height ?? null) : null,
      alt: index === 0 ? (primaryImageMetadata.alt ?? null) : null,
    })),
    source: siteName ?? url.hostname.replace(/^www\./i, ""),
    author: author ?? null,
    publishedTime: publishedTime ?? null,
    modifiedTime: modifiedTime ?? null,
    section: section ?? null,
  };
}
