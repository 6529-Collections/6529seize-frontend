import { NextRequest, NextResponse } from "next/server";

import {
  UrlGuardError,
  assertPublicUrl,
  parsePublicUrl,
  type UrlGuardOptions,
} from "@/lib/security/urlGuard";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import {
  HTML_ACCEPT_HEADER,
  LINK_PREVIEW_USER_AGENT,
  buildGoogleWorkspaceResponse,
  buildResponse,
} from "./utils";
import { createCompoundPlan, type PreviewPlan } from "./compound/service";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = LINK_PREVIEW_USER_AGENT;
const MAX_REDIRECTS = 5;

const HTML_FETCH_HEADERS = {
  accept: HTML_ACCEPT_HEADER,
} as const;

const PUBLIC_URL_POLICY: UrlGuardOptions["policy"] = {
  blockedHosts: ["localhost", "127.0.0.1", "::1"],
  blockedHostSuffixes: [".local", ".internal"],
};

const PUBLIC_URL_OPTIONS: UrlGuardOptions = {
  policy: PUBLIC_URL_POLICY,
};

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

type HeaderOverrides = {
  readonly set?: Record<string, string | undefined>;
  readonly remove?: readonly string[];
};

type HostOverrides = {
  readonly domain: string;
  readonly headers?: HeaderOverrides;
  readonly userAgent?: string;
};

const HOST_OVERRIDES: readonly HostOverrides[] = [
  {
    domain: "facebook.com",
    userAgent: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    headers: {
      set: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        referer: "https://www.facebook.com/",
      },
    },
  },
];

function findHostOverrides(hostname: string): HostOverrides | undefined {
  const normalizedHost = hostname.toLowerCase();
  return HOST_OVERRIDES.find(({ domain }) =>
    normalizedHost === domain || normalizedHost.endsWith(`.${domain}`)
  );
}

function createFetchConfig(url: URL): {
  headers: Record<string, string>;
  userAgent: string;
} {
  const headers: Record<string, string> = { ...HTML_FETCH_HEADERS };
  let userAgent = USER_AGENT;

  const overrides = findHostOverrides(url.hostname);
  if (overrides) {
    if (overrides.headers?.remove) {
      for (const toRemove of overrides.headers.remove) {
        delete headers[toRemove.toLowerCase()];
      }
  }

  if (overrides.headers?.set) {
      for (const [key, value] of Object.entries(overrides.headers.set)) {
        const normalizedKey = key.toLowerCase();
        if (typeof value === "string" && value.length > 0) {
          headers[normalizedKey] = value;
        } else {
          delete headers[normalizedKey];
        }
      }
    }

    if (overrides.userAgent) {
      userAgent = overrides.userAgent;
    }
  }

  return {
    headers,
    userAgent,
  };
}

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
  let currentUrl = url;
  let redirectCount = 0;

  while (true) {
    await assertPublicUrl(currentUrl, PUBLIC_URL_OPTIONS);

    const { headers, userAgent } = createFetchConfig(currentUrl);
    headers["user-agent"] = userAgent;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl.toString(), {
        headers,
        signal: controller.signal,
        redirect: "manual",
      });

      if (REDIRECT_STATUS_CODES.has(response.status)) {
        if (redirectCount >= MAX_REDIRECTS) {
          throw new UrlGuardError("Too many redirects.", "too-many-redirects", 502);
        }

        const location = response.headers.get("location");
        if (!location) {
          throw new UrlGuardError(
            "Redirect response missing location header.",
            "redirect-location-missing",
            502
          );
        }

        let nextUrl: URL;
        try {
          nextUrl = new URL(location, currentUrl);
        } catch (error) {
          throw new UrlGuardError(
            "Redirect response has invalid location.",
            "redirect-location-invalid",
            502,
            { cause: error }
          );
        }

        currentUrl = nextUrl;
        redirectCount += 1;
        continue;
      }

      if (!response.ok) {
        throw new UrlGuardError(
          `Request failed with status ${response.status}`,
          "fetch-failed",
          response.status
        );
      }

      const contentType = response.headers.get("content-type");
      const finalUrl = response.url || currentUrl.toString();
      const html = await response.text();

      return {
        html,
        contentType,
        finalUrl,
      };
    } catch (error) {
      if (error instanceof UrlGuardError) {
        throw error;
      }

      if ((error as { name?: string }).name === "AbortError") {
        throw new UrlGuardError("Request timed out.", "timeout", 504, { cause: error });
      }

      throw new UrlGuardError("Failed to fetch URL.", "fetch-failed", 502, { cause: error });
    } finally {
      clearTimeout(timeoutId);
    }
  }
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
      const googleWorkspace = await buildGoogleWorkspaceResponse(
        finalUrlInstance,
        html,
        url
      );
      const data =
        googleWorkspace ?? buildResponse(finalUrlInstance, html, contentType, finalUrl);
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