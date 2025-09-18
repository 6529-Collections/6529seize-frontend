import { NextRequest, NextResponse } from "next/server";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
} from "@/lib/security/urlGuard";
import { buildResponse } from "./utils";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";
const MAX_REDIRECTS = 5;

const HTML_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

type CacheEntry = {
  readonly expiresAt: number;
  readonly data: LinkPreviewResponse;
};

const cache = new Map<string, CacheEntry>();

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
    {
      timeoutMs: FETCH_TIMEOUT_MS,
      userAgent: USER_AGENT,
      maxRedirects: MAX_REDIRECTS,
    }
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
  if (error instanceof UrlGuardError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "Invalid or forbidden URL";
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = parsePublicUrl(request.nextUrl.searchParams.get("url"));
  } catch (error) {
    return handleGuardError(error);
  }

  try {
    await assertPublicUrl(targetUrl);
  } catch (error) {
    return handleGuardError(error);
  }

  const normalizedUrl = targetUrl.toString();
  const cached = cache.get(normalizedUrl);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const { html, contentType, finalUrl } = await fetchHtml(targetUrl);
    const finalTarget = new URL(finalUrl);
    await assertPublicUrl(finalTarget);

    const data = buildResponse(targetUrl, html, contentType);
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    cache.set(normalizedUrl, entry);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unable to fetch URL";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const revalidate = 0;
