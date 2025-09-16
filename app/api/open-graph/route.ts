import { NextRequest, NextResponse } from "next/server";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";

type CacheEntry = {
  readonly expiresAt: number;
  readonly data: LinkPreviewResponse;
};

const cache = new Map<string, CacheEntry>();

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

function buildResponse(
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

function validateUrl(url: string | null): URL {
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

async function fetchHtml(url: URL): Promise<{ html: string; contentType: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "user-agent": USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    const html = await response.text();
    return { html, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = validateUrl(request.nextUrl.searchParams.get("url"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const normalizedUrl = targetUrl.toString();
  const cached = cache.get(normalizedUrl);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const { html, contentType } = await fetchHtml(targetUrl);
    const data = buildResponse(targetUrl, html, contentType);
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    cache.set(normalizedUrl, entry);

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch URL";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const __TESTING__ = {
  buildResponse,
};
