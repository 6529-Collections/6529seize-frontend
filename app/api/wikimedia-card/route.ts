import { toASCII } from "node:punycode";
import { NextRequest, NextResponse } from "next/server";

import type { WikimediaCardResponse, WikimediaSource, WikimediaImage } from "@/services/api/wikimedia-card";

import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
  type UrlGuardHostPolicy,
} from "@/lib/security/urlGuard";
import { sanitizeHtmlToText } from "@/lib/text/html";

const USER_AGENT = "6529seize-wikimedia-preview/1.0 (+https://6529.io)";
const REQUEST_TIMEOUT_MS = 8000;
const SHORT_LINK_MAX_REDIRECTS = 5;

type CacheEntry = {
  readonly data: WikimediaCardResponse;
  readonly expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

const TTL_BY_KIND: Record<WikimediaCardResponse["kind"], number> = {
  article: 24 * 60 * 60 * 1000,
  disambiguation: 24 * 60 * 60 * 1000,
  "commons-file": 7 * 24 * 60 * 60 * 1000,
  wikidata: 24 * 60 * 60 * 1000,
  unavailable: 60 * 60 * 1000,
};

interface SummaryTarget {
  readonly type: "summary";
  readonly host: string;
  readonly title: string;
  readonly source: WikimediaSource;
  readonly fragment?: { readonly raw: string; readonly display: string };
  readonly canonicalFallback: string;
}

interface CommonsFileTarget {
  readonly type: "commons-file";
  readonly fileName: string;
  readonly fragment?: { readonly raw: string; readonly display: string };
}

interface WikidataTarget {
  readonly type: "wikidata";
  readonly id: string;
  readonly fragment?: { readonly raw: string; readonly display: string };
}

type NormalizedTarget = SummaryTarget | CommonsFileTarget | WikidataTarget;

const decodeFragment = (fragment: string): { raw: string; display: string } | undefined => {
  if (!fragment) {
    return undefined;
  }

  const raw = fragment;
  let decoded = fragment;
  try {
    decoded = decodeURIComponent(fragment);
  } catch {
    decoded = fragment;
  }

  const display = decoded.replaceAll("_", " ").trim();
  if (!display) {
    return undefined;
  }

  return { raw, display };
};

const sanitizeCacheKey = (url: URL): string => {
  const clone = new URL(url.toString());
  clone.hash = "";
  return clone.toString();
};

const parseAcceptLanguage = (header: string | null): string[] => {
  if (!header) {
    return ["en"];
  }

  const entries = header
    .split(",")
    .map((token) => {
      const [langPart, qPart] = token.trim().split(";q=");
      const lang = langPart.toLowerCase();
      const q = qPart ? Number.parseFloat(qPart) : 1;
      return { lang, q: Number.isNaN(q) ? 1 : q };
    })
    .filter((entry) => entry.lang);

  entries.sort((a, b) => b.q - a.q);

  const preferred = new Set<string>();
  for (const entry of entries) {
    preferred.add(entry.lang);
    const base = entry.lang.split("-")[0];
    if (base) {
      preferred.add(base);
    }
  }

  preferred.add("en");

  return Array.from(preferred);
};

const respondWithGuardError = (
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400
) => {
  if (error instanceof UrlGuardError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: fallbackStatus });
};

const WIKIMEDIA_ALLOWED_HOSTS = new Set([
  "w.wiki",
  "wikidata.org",
  "www.wikidata.org",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
]);

const WIKIMEDIA_HOST_POLICY: UrlGuardHostPolicy = {
  allowedHosts: Array.from(WIKIMEDIA_ALLOWED_HOSTS),
  allowedHostSuffixes: ["wikipedia.org"],
};

const isAllowedWikimediaHost = (hostname: string): boolean => {
  if (WIKIMEDIA_ALLOWED_HOSTS.has(hostname)) {
    return true;
  }
  return hostname.endsWith(".wikipedia.org");
};

const stripTrailingDots = (value: string): string => {
  let end = value.length;
  while (end > 0 && value.codePointAt(end - 1) === 46) {
    end -= 1;
  }
  return end === value.length ? value : value.slice(0, end);
};

const ensureWikimediaUrl = (url: URL): void => {
  let asciiHostname: string;
  try {
    asciiHostname = toASCII(url.hostname);
  } catch {
    throw new Error("Unsupported Wikimedia host");
  }

  const normalizedHostname = stripTrailingDots(asciiHostname).toLowerCase();
  if (!normalizedHostname || !isAllowedWikimediaHost(normalizedHostname)) {
    throw new Error("Unsupported Wikimedia host");
  }
};

type WikimediaRequestInit = RequestInit & {
  readonly timeoutMs?: number;
  readonly language?: string;
};

const fetchWithTimeout = async (
  input: string | URL,
  init: WikimediaRequestInit = {}
): Promise<Response> => {
  let targetUrl: URL;
  try {
    targetUrl =
      typeof input === "string"
        ? parsePublicUrl(input)
        : new URL(input.toString());
  } catch (error) {
    if (error instanceof UrlGuardError) {
      throw error;
    }
    throw new UrlGuardError("Invalid URL provided.", "invalid-url", 400, {
      cause: error,
    });
  }

  ensureWikimediaUrl(targetUrl);
  await assertPublicUrl(targetUrl, { policy: WIKIMEDIA_HOST_POLICY });

  const { timeoutMs = REQUEST_TIMEOUT_MS, language, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }
  if (language) {
    headers.set("accept-language", language);
  }

  return fetchPublicUrl(
    targetUrl,
    {
      ...requestInit,
      headers,
    },
    {
      timeoutMs,
      userAgent: USER_AGENT,
      maxRedirects: SHORT_LINK_MAX_REDIRECTS,
      policy: WIKIMEDIA_HOST_POLICY,
    }
  );
};

const fetchJson = async <T>(
  input: string | URL,
  init: WikimediaRequestInit = {}
): Promise<T> => {
  const response = await fetchWithTimeout(input, init);
  if (!response.ok) {
    throw new UrlGuardError(
      `Request failed with status ${response.status}`,
      "fetch-failed",
      response.status
    );
  }
  return response.json() as Promise<T>;
};

const resolveShortLink = async (url: URL): Promise<URL> => {
  ensureWikimediaUrl(url);
  await assertPublicUrl(url, { policy: WIKIMEDIA_HOST_POLICY });

  const response = await fetchPublicUrl(
    url,
    { method: "HEAD" },
    {
      timeoutMs: REQUEST_TIMEOUT_MS,
      userAgent: USER_AGENT,
      maxRedirects: SHORT_LINK_MAX_REDIRECTS,
      policy: WIKIMEDIA_HOST_POLICY,
    }
  );

  let finalResponse = response;

  if (!response.ok) {
    finalResponse = await fetchPublicUrl(
      url,
      {},
      {
        timeoutMs: REQUEST_TIMEOUT_MS,
        userAgent: USER_AGENT,
        maxRedirects: SHORT_LINK_MAX_REDIRECTS,
        policy: WIKIMEDIA_HOST_POLICY,
      }
    );
  }

  if (!finalResponse.ok) {
    throw new UrlGuardError("Unable to resolve short link", "fetch-failed", finalResponse.status);
  }

  const finalUrl = finalResponse.url ? new URL(finalResponse.url) : url;
  ensureWikimediaUrl(finalUrl);
  await assertPublicUrl(finalUrl, { policy: WIKIMEDIA_HOST_POLICY });

  return finalUrl;
};

const stripNamespace = (title: string): string => title.trim();

const disallowedNamespaces = [
  "special:",
  "user:",
  "talk:",
  "user talk:",
  "wikipedia talk:",
  "file talk:",
  "template:",
  "template talk:",
  "help:",
  "help talk:",
  "mediawiki:",
  "mediawiki talk:",
  "portal:",
  "portal talk:",
];

const isDisallowedNamespace = (title: string): boolean => {
  const lower = title.toLowerCase();
  return disallowedNamespaces.some((ns) => lower.startsWith(ns));
};

const normalizeTitle = (title: string): string => {
  const trimmed = title.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replaceAll(/\s+/g, "_");
};

const resolveWikipediaTitle = async (
  lang: string,
  params: URLSearchParams
): Promise<string | null> => {
  if (params.has("title")) {
    return params.get("title");
  }

  if (params.has("curid")) {
    const pageId = params.get("curid");
    if (!pageId) {
      return null;
    }
    const query = new URLSearchParams({
      action: "query",
      format: "json",
      pageids: pageId,
      prop: "info",
    });
    const response = await fetchJson<{
      readonly query?: { readonly pages?: Record<string, { readonly title?: string }> };
    }>(`https://${lang}.wikipedia.org/w/api.php?${query.toString()}`);
    const pages = response.query?.pages;
    if (!pages) {
      return null;
    }
    const page = Object.values(pages)[0];
    return page?.title ?? null;
  }

  if (params.has("oldid")) {
    const revisionId = params.get("oldid");
    if (!revisionId) {
      return null;
    }
    const query = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "revisions",
      revids: revisionId,
    });
    const response = await fetchJson<{
      readonly query?: {
        readonly revisions?: Record<string, { readonly pageid?: number; readonly title?: string }>;
        readonly pages?: Record<string, { readonly title?: string }>;
      };
    }>(`https://${lang}.wikipedia.org/w/api.php?${query.toString()}`);
    const pages = response.query?.pages;
    if (!pages) {
      return null;
    }
    const page = Object.values(pages)[0];
    return page?.title ?? null;
  }

  return null;
};

const extractCommonsFileName = (url: URL): string | null => {
  const path = url.pathname;
  if (!path) {
    return null;
  }

  if (path.startsWith("/wiki/File:")) {
    return decodeURIComponent(path.slice("/wiki/File:".length));
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "wikipedia" && segments[1] === "commons") {
    if (segments[2] === "thumb" && segments.length >= 6) {
      return decodeURIComponent(segments[5]);
    }
    return decodeURIComponent(segments.at(-1)!);
  }

  return decodeURIComponent(segments.at(-1)!);
};

const normalizeTarget = async (url: URL): Promise<NormalizedTarget> => {
  ensureWikimediaUrl(url);

  let currentUrl = url;
  if (currentUrl.hostname.toLowerCase() === "w.wiki") {
    currentUrl = await resolveShortLink(currentUrl);
    ensureWikimediaUrl(currentUrl);
  }

  let hostname = currentUrl.hostname.toLowerCase();
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }

  const fragment = decodeFragment(currentUrl.hash ? currentUrl.hash.slice(1) : "");

  if (hostname.endsWith(".wikipedia.org") || hostname.endsWith(".m.wikipedia.org")) {
    let langHost = hostname;
    if (langHost.endsWith(".m.wikipedia.org")) {
      langHost = langHost.replace(".m.wikipedia.org", ".wikipedia.org");
    }
    if (langHost.startsWith("m.")) {
      langHost = langHost.slice(2);
    }
    const lang = langHost.replace(".wikipedia.org", "");
    const canonicalHost = `${lang}.wikipedia.org`;

    let title: string | null = null;

    if (currentUrl.pathname.startsWith("/wiki/")) {
      const raw = currentUrl.pathname.slice(6);
      title = decodeURIComponent(raw);
    } else if (currentUrl.pathname.startsWith("/w/")) {
      const params = currentUrl.searchParams;
      title = await resolveWikipediaTitle(lang, params);
    }

    if (!title) {
      throw new Error("Unable to resolve Wikipedia title");
    }

    const stripped = stripNamespace(title);
    if (isDisallowedNamespace(stripped)) {
      throw new Error("Namespace is not supported");
    }

    const normalizedTitle = normalizeTitle(stripped);
    const canonicalFallback = `https://${canonicalHost}/wiki/${encodeURIComponent(normalizedTitle)}`;

    return {
      type: "summary",
      host: canonicalHost,
      title: normalizedTitle,
      source: "wikipedia",
      fragment,
      canonicalFallback,
    };
  }

  if (hostname === "commons.wikimedia.org") {
    if (currentUrl.pathname.startsWith("/wiki/File:")) {
      const fileName = currentUrl.pathname.slice("/wiki/File:".length);
      return { type: "commons-file", fileName, fragment };
    }

    const titleSegment = currentUrl.pathname.startsWith("/wiki/")
      ? currentUrl.pathname.slice(6)
      : currentUrl.pathname.replace(/^\//, "");
    const title = decodeURIComponent(titleSegment);
    const normalizedTitle = normalizeTitle(title);
    const canonicalFallback = `https://commons.wikimedia.org/wiki/${encodeURIComponent(normalizedTitle)}`;
    return {
      type: "summary",
      host: "commons.wikimedia.org",
      title: normalizedTitle,
      source: "wikimedia-commons",
      fragment,
      canonicalFallback,
    };
  }

  if (hostname === "upload.wikimedia.org") {
    const fileName = extractCommonsFileName(currentUrl);
    if (!fileName) {
      throw new Error("Unable to determine file name");
    }
    return { type: "commons-file", fileName, fragment };
  }

  if (hostname === "wikidata.org" || hostname === "www.wikidata.org") {
    const path = currentUrl.pathname.startsWith("/wiki/")
      ? currentUrl.pathname.slice(6)
      : currentUrl.pathname.replace(/^\//, "");
    const id = path.toUpperCase();
    return { type: "wikidata", id, fragment };
  }

  throw new Error("Unsupported Wikimedia host");
};

const sanitizeHtml = (value: string): string => {
  return sanitizeHtmlToText(value, { preserveTagSpacing: true })
    .replaceAll(/\s+/g, " ")
    .trim();
};

const buildSummaryCard = async (
  target: SummaryTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  try {
    const summary = await fetchJson<{
      readonly title?: string;
      readonly description?: string;
      readonly extract?: string;
      readonly lang?: string;
      readonly thumbnail?: { readonly source?: string; readonly width?: number; readonly height?: number };
      readonly content_urls?: { readonly desktop?: { readonly page?: string } };
      readonly timestamp?: string;
      readonly type?: string;
      readonly coordinates?: { readonly lat?: number; readonly lon?: number };
    }>(
      `https://${target.host}/api/rest_v1/page/summary/${encodeURIComponent(target.title)}?redirect=true`,
      { language: languages[0] }
    );

    const canonicalUrl =
      summary.content_urls?.desktop?.page ?? target.canonicalFallback;
    const pageUrl = target.fragment ? `${canonicalUrl}#${target.fragment.raw}` : canonicalUrl;

    const thumbnail: WikimediaImage | null = summary.thumbnail?.source
      ? {
          url: summary.thumbnail.source,
          width: summary.thumbnail.width,
          height: summary.thumbnail.height,
          alt: summary.title ?? target.title,
        }
      : null;

    const description = summary.description ? sanitizeHtml(summary.description) : null;
    const extract = summary.extract ? sanitizeHtml(summary.extract) : null;

    if (summary.type === "disambiguation") {
      let items: Array<{
        readonly title: string;
        readonly description?: string | null;
        readonly url: string;
        readonly thumbnail?: WikimediaImage | null;
      }> | undefined;
      try {
        const related = await fetchJson<{
          readonly pages?: ReadonlyArray<{
            readonly title?: string;
            readonly description?: string;
            readonly extract?: string;
            readonly thumbnail?: { readonly source?: string; readonly width?: number; readonly height?: number };
            readonly content_urls?: { readonly desktop?: { readonly page?: string } };
          }>;
        }>(
          `https://${target.host}/api/rest_v1/page/related/${encodeURIComponent(target.title)}`,
          { language: languages[0] }
        );

        items = related.pages?.slice(0, 5).map((page) => ({
          title: page.title ?? "",
          description: page.description
            ? sanitizeHtml(page.description)
            : page.extract
            ? sanitizeHtml(page.extract)
            : null,
          url: page.content_urls?.desktop?.page ?? "",
          thumbnail: page.thumbnail?.source
            ? {
                url: page.thumbnail.source,
                width: page.thumbnail.width,
                height: page.thumbnail.height,
                alt: page.title ?? "",
              }
            : null,
        }));
      } catch {
        items = undefined;
      }

      return {
        kind: "disambiguation",
        source: target.source,
        canonicalUrl,
        pageUrl,
        title: summary.title ?? target.title,
        description,
        extract,
        lang: summary.lang ?? languages[0] ?? "en",
        section: target.fragment?.display ?? null,
        items: items?.filter((item) => Boolean(item.title && item.url)) ?? [],
      };
    }

    return {
      kind: "article",
      source: target.source,
      canonicalUrl,
      pageUrl,
      title: summary.title ?? target.title,
      description,
      extract,
      lang: summary.lang ?? languages[0] ?? "en",
      thumbnail,
      coordinates:
        summary.coordinates?.lat !== undefined && summary.coordinates?.lon !== undefined
          ? { lat: summary.coordinates.lat, lon: summary.coordinates.lon }
          : null,
      lastModified: summary.timestamp ?? null,
      section: target.fragment?.display ?? null,
    };
  } catch {
    const canonicalUrl = target.canonicalFallback;
    const pageUrl = target.fragment ? `${canonicalUrl}#${target.fragment.raw}` : canonicalUrl;
    return {
      kind: "unavailable",
      source: target.source,
      canonicalUrl,
      pageUrl,
      title: null,
    };
  }
};

const buildCommonsCard = async (
  target: CommonsFileTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  const fileTitle = target.fileName.startsWith("File:") ? target.fileName : `File:${target.fileName}`;
  const canonicalUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle)}`;
  const pageUrl = target.fragment ? `${canonicalUrl}#${target.fragment.raw}` : canonicalUrl;

  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: fileTitle,
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: "1200",
    });
    const response = await fetchJson<{
      readonly query?: {
        readonly pages?: Record<
          string,
          {
            readonly title?: string;
            readonly missing?: string;
            readonly imageinfo?: ReadonlyArray<{
              readonly url?: string;
              readonly mime?: string;
              readonly size?: number;
              readonly width?: number;
              readonly height?: number;
              readonly thumburl?: string;
              readonly thumbwidth?: number;
              readonly thumbheight?: number;
              readonly descriptionurl?: string;
              readonly extmetadata?: Record<string, { readonly value?: string }>;
            }>;
          }
        >;
      };
    }>(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);

    const pages = response.query?.pages;
    const page = pages ? Object.values(pages)[0] : undefined;
    if (!page || page.missing === "") {
      throw new Error("missing");
    }
    const info = page.imageinfo?.[0];
    if (!info) {
      throw new Error("missing");
    }

    const metadata = info.extmetadata ?? {};
    const getMeta = (key: string) => {
      const raw = metadata[key]?.value;
      if (!raw) {
        return undefined;
      }
      return sanitizeHtml(raw);
    };

    const description = getMeta("ImageDescription");
    const credit = getMeta("Credit");
    const artist = getMeta("Artist");
    const licenseName = getMeta("LicenseShortName") ?? getMeta("UsageTerms");
    const licenseUrl = metadata["LicenseUrl"]?.value ?? null;
    const requiresAttribution = (metadata["AttributionRequired"]?.value ?? "").toLowerCase() === "true";

    const thumbnail: WikimediaImage | null = info.thumburl
      ? {
          url: info.thumburl,
          width: info.thumbwidth,
          height: info.thumbheight,
          alt: description ?? page.title ?? fileTitle,
        }
      : info.url
      ? {
          url: info.url,
          width: info.width,
          height: info.height,
          alt: description ?? page.title ?? fileTitle,
        }
      : null;

    const original: (WikimediaImage & { readonly mime?: string | null }) | null = info.url
      ? {
          url: info.url,
          width: info.width,
          height: info.height,
          alt: description ?? page.title ?? fileTitle,
          mime: info.mime ?? null,
        }
      : null;

    return {
      kind: "commons-file",
      source: "wikimedia-commons",
      canonicalUrl,
      pageUrl,
      title: page.title ?? fileTitle,
      description: description ?? null,
      credit: credit ?? null,
      author: artist ?? null,
      license: licenseName
        ? { name: licenseName, url: licenseUrl, requiresAttribution }
        : null,
      thumbnail,
      original,
    };
  } catch {
    return {
      kind: "unavailable",
      source: "wikimedia-commons",
      canonicalUrl,
      pageUrl,
      title: null,
    };
  }
};

const selectLabel = (
  entries: Record<string, { readonly value?: string }> | undefined,
  languages: readonly string[]
): string | undefined => {
  if (!entries) {
    return undefined;
  }
  for (const lang of languages) {
    const entry = entries[lang];
    if (entry?.value) {
      return entry.value;
    }
  }
  return undefined;
};

const fetchEntityLabels = async (
  ids: readonly string[],
  languages: readonly string[]
): Promise<Record<string, string>> => {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) {
    return {};
  }

  const labels: Record<string, string> = {};
  const languageParam = languages.join("|");

  for (let i = 0; i < unique.length; i += 50) {
    const slice = unique.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      props: "labels",
      ids: slice.join("|"),
      languages: languageParam,
    });

    try {
      const response = await fetchJson<{
        readonly entities?: Record<
          string,
          { readonly labels?: Record<string, { readonly value?: string }> }
        >;
      }>(`https://www.wikidata.org/w/api.php?${params.toString()}`);

      const entities = response.entities ?? {};
      for (const id of slice) {
        const entity = entities[id];
        const label = selectLabel(entity?.labels, languages);
        if (label) {
          labels[id] = label;
        }
      }
    } catch {
      // ignore chunk errors
    }
  }

  return labels;
};

const formatTimeValue = (value: {
  readonly time?: string;
  readonly precision?: number;
}): string | null => {
  if (!value.time) {
    return null;
  }
  const precision = value.precision ?? 11;
  const time = value.time.replace(/^\+/, "");
  const [datePart] = time.split("T");
  if (!datePart) {
    return null;
  }
  const [year, month = "", day = ""] = datePart.split("-");

  if (precision >= 11 && day) {
    return `${year}-${month}-${day}`;
  }
  if (precision >= 10 && month) {
    return `${year}-${month}`;
  }
  if (precision >= 9) {
    return year;
  }
  return year;
};

const FACT_PROPERTIES = ["P31", "P17", "P27", "P495", "P571", "P170"] as const;

const buildWikidataCard = async (
  target: WikidataTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  const canonicalUrl = `https://www.wikidata.org/wiki/${encodeURIComponent(target.id)}`;
  const pageUrl = target.fragment ? `${canonicalUrl}#${target.fragment.raw}` : canonicalUrl;

  try {
    const response = await fetchJson<{
      readonly entities?: Record<
        string,
        {
          readonly labels?: Record<string, { readonly value?: string }>;
          readonly descriptions?: Record<string, { readonly value?: string }>;
          readonly claims?: Record<
            string,
            ReadonlyArray<{
              readonly mainsnak?: {
                readonly datavalue?: { readonly type?: string; readonly value?: unknown };
              };
            }>
          >;
          readonly sitelinks?: Record<string, { readonly title?: string; readonly url?: string }>;
        }
      >;
    }>(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(target.id)}.json`);

    const entity = response.entities?.[target.id];
    if (!entity) {
      throw new Error("missing");
    }

    const label = selectLabel(entity.labels, languages) ?? target.id;
    const description = selectLabel(entity.descriptions, languages) ?? null;

    const claims = entity.claims ?? {};
    const referencedIds: string[] = [];
    const propertyIds: string[] = [];
    const facts: Array<{ propertyId: string; propertyLabel: string; value: string }> = [];

    for (const propertyId of FACT_PROPERTIES) {
      const claim = claims[propertyId]?.[0]?.mainsnak;
      if (!claim?.datavalue) {
        continue;
      }
      propertyIds.push(propertyId);
      const { type, value } = claim.datavalue as { type?: string; value?: unknown };
      let formatted: string | null = null;

      if (type === "wikibase-entityid" && value && typeof value === "object" && "id" in value) {
        const entityId = (value as { readonly id?: string }).id;
        if (entityId) {
          referencedIds.push(entityId);
          formatted = entityId;
        }
      } else if (type === "time" && value && typeof value === "object") {
        formatted = formatTimeValue(value as { readonly time?: string; readonly precision?: number });
      } else if (type === "monolingualtext" && value && typeof value === "object" && "text" in value) {
        formatted = String((value as { readonly text?: string }).text);
      } else if (type === "string" && typeof value === "string") {
        formatted = value;
      } else if (type === "globecoordinate" && value && typeof value === "object") {
        const coord = value as { readonly latitude?: number; readonly longitude?: number };
        if (typeof coord.latitude === "number" && typeof coord.longitude === "number") {
          formatted = `${coord.latitude.toFixed(2)}, ${coord.longitude.toFixed(2)}`;
        }
      }

      if (!formatted) {
        continue;
      }

      facts.push({ propertyId, propertyLabel: propertyId, value: formatted });
      if (facts.length >= 4) {
        break;
      }
    }

    const labelLookup = await fetchEntityLabels([...referencedIds, ...propertyIds], languages);

    const resolvedFacts = facts.map((fact) => {
      const propertyLabel = labelLookup[fact.propertyId] ?? fact.propertyId;
      const value = labelLookup[fact.value] ?? fact.value;
      return { propertyId: fact.propertyId, propertyLabel, value };
    });

    let image: WikimediaImage | null = null;
    const imageClaim = claims["P18"]?.[0]?.mainsnak?.datavalue;
    if (imageClaim && imageClaim.type === "string" && typeof imageClaim.value === "string") {
      const fileName = imageClaim.value.startsWith("File:") ? imageClaim.value : `File:${imageClaim.value}`;
      const commonsData = await buildCommonsCard({ type: "commons-file", fileName }, languages);
      if (commonsData.kind === "commons-file" && commonsData.thumbnail) {
        image = commonsData.thumbnail;
      }
    }

    const sitelinks: Array<{ title: string; url: string; site: string }> = [];
    if (entity.sitelinks) {
      const preferredSites = languages.map((lang) => `${lang.split("-")[0]}wiki`);
      preferredSites.push("enwiki");
      const added = new Set<string>();
      for (const siteKey of preferredSites) {
        const link = entity.sitelinks[siteKey];
        if (link?.url && !added.has(link.url)) {
          sitelinks.push({ title: link.title ?? siteKey, url: link.url, site: siteKey });
          added.add(link.url);
        }
        if (sitelinks.length >= 3) {
          break;
        }
      }
    }

    return {
      kind: "wikidata",
      source: "wikidata",
      canonicalUrl,
      pageUrl,
      title: label,
      description: description ? sanitizeHtml(description) : null,
      lang: languages[0] ?? "en",
      image,
      facts: resolvedFacts,
      sitelinks,
    };
  } catch {
    return {
      kind: "unavailable",
      source: "wikidata",
      canonicalUrl,
      pageUrl,
      title: null,
    };
  }
};

const buildCard = async (
  target: NormalizedTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  switch (target.type) {
    case "summary":
      return buildSummaryCard(target, languages);
    case "commons-file":
      return buildCommonsCard(target, languages);
    case "wikidata":
      return buildWikidataCard(target, languages);
  }
};

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = parsePublicUrl(request.nextUrl.searchParams.get("url"));
    ensureWikimediaUrl(targetUrl);
  } catch (error) {
    return respondWithGuardError(error, "Invalid Wikimedia URL.");
  }

  try {
    await assertPublicUrl(targetUrl, { policy: WIKIMEDIA_HOST_POLICY });
  } catch (error) {
    return respondWithGuardError(error, "The provided URL is not allowed.");
  }

  const cacheKey = sanitizeCacheKey(targetUrl);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data);
  }

  const languages = parseAcceptLanguage(request.headers.get("accept-language"));

  let target: NormalizedTarget;
  try {
    target = await normalizeTarget(targetUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unsupported Wikimedia URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const card = await buildCard(target, languages);
  const ttl = TTL_BY_KIND[card.kind] ?? TTL_BY_KIND.unavailable;
  const entry: CacheEntry = { data: card, expiresAt: now + ttl };

  cache.set(cacheKey, entry);
  cache.set(card.canonicalUrl, entry);

  return NextResponse.json(card);
}

export const dynamic = "force-dynamic";
