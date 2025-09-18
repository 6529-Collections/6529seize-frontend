import { NextRequest, NextResponse } from "next/server";

import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
} from "@/lib/security/urlGuard";
import type {
  FetchPublicUrlOptions,
  UrlGuardOptions,
} from "@/lib/security/urlGuard";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { buildResponse } from "./utils";
import { createCompoundPlan, type PreviewPlan } from "./compound/service";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";
const MAX_REDIRECTS = 5;

const HTML_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

const PUBLIC_URL_POLICY: UrlGuardOptions["policy"] = {
  blockedHosts: ["localhost", "127.0.0.1", "::1"],
  blockedHostSuffixes: [".local", ".internal"],
};

const PUBLIC_URL_OPTIONS: UrlGuardOptions = {
  policy: PUBLIC_URL_POLICY,
};

const PUBLIC_FETCH_OPTIONS: FetchPublicUrlOptions = {
  ...PUBLIC_URL_OPTIONS,
  timeoutMs: FETCH_TIMEOUT_MS,
  userAgent: USER_AGENT,
  maxRedirects: MAX_REDIRECTS,
};

type CacheEntry = {
  readonly expiresAt: number;
  readonly data: LinkPreviewResponse;
};

const cache = new Map<string, CacheEntry>();

const isUrlGuardError = (error: unknown): error is UrlGuardError =>
  error instanceof UrlGuardError ||
  (typeof error === "object" && error !== null && (error as { name?: string }).name === "UrlGuardError");

async function fetchHtml(
  url: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  const response = await fetchPublicUrl(
    url,
    {
      headers: {
        accept: HTML_ACCEPT_HEADER,
      },
    },
    PUBLIC_FETCH_OPTIONS
  );

  if (!response.ok) {
    throw new UrlGuardError(
      `Request failed with status ${response.status}`,
      "fetch-failed",
      response.status
    );
  }

  const contentType = response.headers.get("content-type");
  const html = await response.text();
  return { html, contentType, finalUrl: response.url || url.toString() };
}

function handleGuardError(error: unknown, fallbackStatus = 400) {
  if (isUrlGuardError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "Invalid or forbidden URL";
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}

function createGenericPlan(url: URL): PreviewPlan {
  return {
    cacheKey: `generic:${url.toString()}`,
    execute: async () => {
      const { html, contentType, finalUrl } = await fetchHtml(url);
      const finalUrlInstance = new URL(finalUrl);
      await assertPublicUrl(finalUrlInstance, PUBLIC_URL_OPTIONS);

      const data = buildResponse(url, html, contentType);
      return { data, ttl: CACHE_TTL_MS };
    },
  };
}

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = parsePublicUrl(request.nextUrl.searchParams.get("url"));
  } catch (error) {
    return handleGuardError(error);
  }

  try {
    await assertPublicUrl(targetUrl, PUBLIC_URL_OPTIONS);
  } catch (error) {
    return handleGuardError(error);
  }

  const compoundPlan = createCompoundPlan(targetUrl);
  const plan = compoundPlan ?? createGenericPlan(targetUrl);

  const cached = cache.get(plan.cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const { data, ttl } = await plan.execute();
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + ttl,
    };

    cache.set(plan.cacheKey, entry);

    return NextResponse.json(data);
  } catch (error) {
    if (isUrlGuardError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unable to fetch URL";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const revalidate = 0;
