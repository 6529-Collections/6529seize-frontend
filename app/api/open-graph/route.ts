import { NextRequest, NextResponse } from "next/server";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { buildResponse, ensureUrlIsPublic, validateUrl } from "./utils";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const HTML_BYTE_LIMIT = 128 * 1024;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type CacheEntry = {
  readonly expiresAt: number;
  readonly data: LinkPreviewResponse;
};

const cache = new Map<string, CacheEntry>();

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

async function fetchHtml(
  url: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  let currentUrl = url;
  let redirectCount = 0;

  while (true) {
    await ensureUrlIsPublic(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl.toString(), {
        headers: {
          "user-agent": USER_AGENT,
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "manual",
      });

      if (REDIRECT_STATUS_CODES.has(response.status)) {
        if (redirectCount >= MAX_REDIRECTS) {
          throw new Error("Too many redirects");
        }

        const location = response.headers.get("location");
        if (!location) {
          throw new Error("Redirect response missing location header");
        }

        const nextUrl = new URL(location, currentUrl);
        currentUrl = nextUrl;
        redirectCount += 1;
        continue;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      const reader = response.body?.getReader();

      if (!reader) {
        const html = await response.text();
        return {
          html: html.slice(0, HTML_BYTE_LIMIT),
          contentType,
          finalUrl: currentUrl.toString(),
        };
      }

      const decoder = new TextDecoder();
      let receivedBytes = 0;
      let html = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || !value) {
          break;
        }

        const slice =
          receivedBytes + value.length > HTML_BYTE_LIMIT
            ? value.subarray(0, HTML_BYTE_LIMIT - receivedBytes)
            : value;

        html += decoder.decode(slice, { stream: true });
        receivedBytes += slice.length;

        if (receivedBytes >= HTML_BYTE_LIMIT) {
          break;
        }
      }

      html += decoder.decode();

      return { html, contentType, finalUrl: currentUrl.toString() };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = validateUrl(request.nextUrl.searchParams.get("url"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid or forbidden URL";
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
    const data = buildResponse(targetUrl, html, contentType, finalUrl);
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
