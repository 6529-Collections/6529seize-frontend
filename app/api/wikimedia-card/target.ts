import { toASCII } from "node:punycode";
import { NextResponse } from "next/server";

import type { WikimediaSource } from "@/services/api/wikimedia-card";
import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
  type UrlGuardHostPolicy,
} from "@/lib/security/urlGuard";

const USER_AGENT = "6529seize-wikimedia-preview/1.0 (+https://6529.io)";
const REQUEST_TIMEOUT_MS = 8000;
const SHORT_LINK_MAX_REDIRECTS = 5;

export interface SummaryTarget {
  readonly type: "summary";
  readonly host: string;
  readonly title: string;
  readonly source: WikimediaSource;
  readonly fragment?:
    | { readonly raw: string; readonly display: string }
    | undefined;
  readonly canonicalFallback: string;
}

export interface CommonsFileTarget {
  readonly type: "commons-file";
  readonly fileName: string;
  readonly fragment?:
    | { readonly raw: string; readonly display: string }
    | undefined;
}

export interface WikidataTarget {
  readonly type: "wikidata";
  readonly id: string;
  readonly fragment?:
    | { readonly raw: string; readonly display: string }
    | undefined;
}

export type NormalizedTarget =
  | SummaryTarget
  | CommonsFileTarget
  | WikidataTarget;

const decodeFragment = (
  fragment: string
): { raw: string; display: string } | undefined => {
  if (!fragment) {
    return undefined;
  }

  const raw = fragment;
  let decoded: string;
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

export const sanitizeCacheKey = (url: URL): string => {
  const clone = new URL(url.toString());
  clone.hash = "";
  return clone.toString();
};

export const parseAcceptLanguage = (header: string | null): string[] => {
  if (!header) {
    return ["en"];
  }

  const entries = header
    .split(",")
    .map((token) => {
      const [langPart, qPart] = token.trim().split(";q=");
      const lang = langPart?.toLowerCase();
      const q = qPart ? Number.parseFloat(qPart) : 1;
      return { lang, q: Number.isNaN(q) ? 1 : q };
    })
    .filter((entry) => entry.lang);

  entries.sort((a, b) => b.q - a.q);

  const preferred = new Set<string>();
  for (const entry of entries) {
    if (!entry.lang) {
      continue;
    }
    preferred.add(entry.lang);
    const base = entry.lang.split("-")[0];
    if (base) {
      preferred.add(base);
    }
  }

  preferred.add("en");

  return Array.from(preferred);
};

export const respondWithGuardError = (
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400
) => {
  if (error instanceof UrlGuardError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
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

export const WIKIMEDIA_HOST_POLICY: UrlGuardHostPolicy = {
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

export const ensureWikimediaUrl = (url: URL): void => {
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
  readonly timeoutMs?: number | undefined;
  readonly language?: string | undefined;
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

export const fetchJson = async <T>(
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
    throw new UrlGuardError(
      "Unable to resolve short link",
      "fetch-failed",
      finalResponse.status
    );
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
      readonly query?:
        | {
            readonly pages?:
              | Record<string, { readonly title?: string | undefined }>
              | undefined;
          }
        | undefined;
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
      readonly query?:
        | {
            readonly revisions?:
              | Record<
                  string,
                  {
                    readonly pageid?: number | undefined;
                    readonly title?: string | undefined;
                  }
                >
              | undefined;
            readonly pages?:
              | Record<string, { readonly title?: string | undefined }>
              | undefined;
          }
        | undefined;
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
      if (!segments[5]) {
        return null;
      }
      return decodeURIComponent(segments[5]);
    }
    return decodeURIComponent(segments.at(-1)!);
  }

  return decodeURIComponent(segments.at(-1)!);
};

type DecodedFragment = ReturnType<typeof decodeFragment>;

const normalizeWikimediaHostname = (url: URL): string => {
  const hostname = url.hostname.toLowerCase();
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
};

const normalizeWikipediaTarget = async (
  currentUrl: URL,
  hostname: string,
  fragment: DecodedFragment
): Promise<SummaryTarget> => {
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
    title = decodeURIComponent(currentUrl.pathname.slice(6));
  } else if (currentUrl.pathname.startsWith("/w/")) {
    title = await resolveWikipediaTitle(lang, currentUrl.searchParams);
  }

  if (!title) {
    throw new Error("Unable to resolve Wikipedia title");
  }

  const stripped = stripNamespace(title);
  if (isDisallowedNamespace(stripped)) {
    throw new Error("Namespace is not supported");
  }

  const normalizedTitle = normalizeTitle(stripped);
  return {
    type: "summary",
    host: canonicalHost,
    title: normalizedTitle,
    source: "wikipedia",
    fragment,
    canonicalFallback: `https://${canonicalHost}/wiki/${encodeURIComponent(
      normalizedTitle
    )}`,
  };
};

const normalizeCommonsTarget = (
  currentUrl: URL,
  fragment: DecodedFragment
): NormalizedTarget => {
  if (currentUrl.pathname.startsWith("/wiki/File:")) {
    return {
      type: "commons-file",
      fileName: currentUrl.pathname.slice("/wiki/File:".length),
      fragment,
    };
  }

  const titleSegment = currentUrl.pathname.startsWith("/wiki/")
    ? currentUrl.pathname.slice(6)
    : currentUrl.pathname.replace(/^\//, "");
  const normalizedTitle = normalizeTitle(decodeURIComponent(titleSegment));
  return {
    type: "summary",
    host: "commons.wikimedia.org",
    title: normalizedTitle,
    source: "wikimedia-commons",
    fragment,
    canonicalFallback: `https://commons.wikimedia.org/wiki/${encodeURIComponent(
      normalizedTitle
    )}`,
  };
};

const normalizeUploadTarget = (
  currentUrl: URL,
  fragment: DecodedFragment
): CommonsFileTarget => {
  const fileName = extractCommonsFileName(currentUrl);
  if (!fileName) {
    throw new Error("Unable to determine file name");
  }
  return { type: "commons-file", fileName, fragment };
};

const normalizeWikidataTarget = (
  currentUrl: URL,
  fragment: DecodedFragment
): WikidataTarget => {
  const path = currentUrl.pathname.startsWith("/wiki/")
    ? currentUrl.pathname.slice(6)
    : currentUrl.pathname.replace(/^\//, "");
  return { type: "wikidata", id: path.toUpperCase(), fragment };
};

export const normalizeTarget = async (url: URL): Promise<NormalizedTarget> => {
  ensureWikimediaUrl(url);

  let currentUrl = url;
  if (currentUrl.hostname.toLowerCase() === "w.wiki") {
    currentUrl = await resolveShortLink(currentUrl);
    ensureWikimediaUrl(currentUrl);
  }

  const hostname = normalizeWikimediaHostname(currentUrl);
  const fragment = decodeFragment(
    currentUrl.hash ? currentUrl.hash.slice(1) : ""
  );

  if (
    hostname.endsWith(".wikipedia.org") ||
    hostname.endsWith(".m.wikipedia.org")
  ) {
    return normalizeWikipediaTarget(currentUrl, hostname, fragment);
  }

  if (hostname === "commons.wikimedia.org") {
    return normalizeCommonsTarget(currentUrl, fragment);
  }

  if (hostname === "upload.wikimedia.org") {
    return normalizeUploadTarget(currentUrl, fragment);
  }

  if (hostname === "wikidata.org" || hostname === "www.wikidata.org") {
    return normalizeWikidataTarget(currentUrl, fragment);
  }

  throw new Error("Unsupported Wikimedia host");
};
