import { NextRequest, NextResponse } from "next/server";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { buildResponse, ensureUrlIsPublic, validateUrl } from "./utils";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";

type CacheEntry = {
  readonly expiresAt: number;
  readonly data: LinkPreviewResponse;
};

const cache = new Map<string, CacheEntry>();

async function fetchHtml(
  url: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
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
    return { html, contentType, finalUrl: response.url };
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

  try {
    await ensureUrlIsPublic(targetUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The provided URL is not allowed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const normalizedUrl = targetUrl.toString();
  const cached = cache.get(normalizedUrl);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const { html, contentType, finalUrl } = await fetchHtml(targetUrl);
    await ensureUrlIsPublic(new URL(finalUrl));
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
