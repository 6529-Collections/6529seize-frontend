import { NextRequest, NextResponse } from "next/server";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import {
  buildTruthSocialResponse,
  buildTruthSocialUnavailableResponse,
  detectTruthSocialTarget,
  TRUTH_SOCIAL_BROWSER_UA,
  TRUTH_SOCIAL_FETCH_TIMEOUT_MS,
  TRUTH_SOCIAL_POST_CACHE_TTL_MS,
  TRUTH_SOCIAL_PROFILE_CACHE_TTL_MS,
  type TruthSocialTarget,
} from "./truthsocial";
import { buildResponse, ensureUrlIsPublic, validateUrl } from "./utils";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
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

interface FetchHtmlOptions {
  readonly headers?: Record<string, string>;
  readonly timeoutMs?: number;
}

async function fetchHtml(
  url: URL,
  options: FetchHtmlOptions = {}
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  let currentUrl = url;
  let redirectCount = 0;
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;

  while (true) {
    await ensureUrlIsPublic(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestHeaders: Record<string, string> = {
        "user-agent": USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        ...options.headers,
      };

      const response = await fetch(currentUrl.toString(), {
        headers: requestHeaders,
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

const TRUTH_SOCIAL_FLAG_CANDIDATES = [
  "FEATURE_TRUTHSOCIAL_CARD",
  "NEXT_PUBLIC_FEATURE_TRUTHSOCIAL_CARD",
] as const;

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "on", "yes", "enabled"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "off", "no", "disabled"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

function resolveTruthSocialFlag(): boolean {
  for (const flag of TRUTH_SOCIAL_FLAG_CANDIDATES) {
    const value = process.env[flag];
    if (value !== undefined) {
      return parseBooleanFlag(value, true);
    }
  }

  return true;
}

const truthSocialCardEnabled = resolveTruthSocialFlag();

function getCacheTtl(target: TruthSocialTarget | null): number {
  if (!target) {
    return DEFAULT_CACHE_TTL_MS;
  }

  return target.kind === "profile"
    ? TRUTH_SOCIAL_PROFILE_CACHE_TTL_MS
    : TRUTH_SOCIAL_POST_CACHE_TTL_MS;
}

export async function GET(request: NextRequest) {
  let targetUrl: URL;
  let originalUrlString: string;

  try {
    targetUrl = validateUrl(request.nextUrl.searchParams.get("url"));
    originalUrlString = targetUrl.toString();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid or forbidden URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const truthSocialTarget =
    truthSocialCardEnabled ? detectTruthSocialTarget(targetUrl) : null;

  if (truthSocialTarget) {
    try {
      targetUrl = new URL(truthSocialTarget.canonicalUrl);
    } catch {
      // Fall back to original target if canonical parsing fails
    }
  }

  try {
    await ensureUrlIsPublic(targetUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The provided URL is not allowed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const cacheKey = truthSocialTarget ? truthSocialTarget.cacheKey : targetUrl.toString();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    if (truthSocialTarget) {
      const { html, contentType, finalUrl } = await fetchHtml(targetUrl, {
        headers: { "user-agent": TRUTH_SOCIAL_BROWSER_UA },
        timeoutMs: TRUTH_SOCIAL_FETCH_TIMEOUT_MS,
      });
      await ensureUrlIsPublic(new URL(finalUrl));
      const data = buildTruthSocialResponse(
        truthSocialTarget,
        html,
        contentType,
        originalUrlString
      );
      const entry: CacheEntry = {
        data,
        expiresAt: Date.now() + getCacheTtl(truthSocialTarget),
      };
      cache.set(cacheKey, entry);
      return NextResponse.json(data);
    }

    const { html, contentType, finalUrl } = await fetchHtml(targetUrl);
    await ensureUrlIsPublic(new URL(finalUrl));
    const data = buildResponse(targetUrl, html, contentType);
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
    };

    cache.set(cacheKey, entry);

    return NextResponse.json(data);
  } catch (error) {
    if (truthSocialTarget) {
      const fallback = buildTruthSocialUnavailableResponse(
        truthSocialTarget,
        originalUrlString
      );
      cache.set(cacheKey, {
        data: fallback,
        expiresAt: Date.now() + getCacheTtl(truthSocialTarget),
      });
      return NextResponse.json(fallback);
    }

    const message = error instanceof Error ? error.message : "Unable to fetch URL";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";

export const revalidate = 0;
