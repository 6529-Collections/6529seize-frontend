import { NextRequest, NextResponse } from "next/server";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import { buildResponse, ensureUrlIsPublic, validateUrl } from "./utils";
import { createCompoundPlan, type PreviewPlan } from "./compound/service";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";

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
      const html = await response.text();
      return { html, contentType, finalUrl: currentUrl.toString() };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function createGenericPlan(url: URL): PreviewPlan {
  return {
    cacheKey: `generic:${url.toString()}`,
    execute: async () => {
      const { html, contentType, finalUrl } = await fetchHtml(url);
      await ensureUrlIsPublic(new URL(finalUrl));
      const data = buildResponse(url, html, contentType);
      return { data, ttl: CACHE_TTL_MS };
    },
  };
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
    const message = error instanceof Error ? error.message : "Unable to fetch URL";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const revalidate = 0;
