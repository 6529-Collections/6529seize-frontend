import { NextRequest, NextResponse } from "next/server";

import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
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
import { detectEnsTarget, fetchEnsPreview, EnsPreviewError } from "./ens";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = LINK_PREVIEW_USER_AGENT;
const MAX_REDIRECTS = 5;

const HTML_FETCH_HEADERS = {
  accept: HTML_ACCEPT_HEADER,
} as const;

const PUBLIC_URL_POLICY: UrlGuardOptions["policy"] = {
  blockedHosts: ["localhost", "127.0.0.1", "::1"],
  blockedHostSuffixes: [".local", ".internal", ".lan", ".intra", ".corp", ".home", ".test"],
};

const PUBLIC_URL_OPTIONS: UrlGuardOptions = {
  policy: PUBLIC_URL_POLICY,
};

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

function applyHeaderRemovals(
  headers: Record<string, string>,
  toRemove?: readonly string[]
): void {
  if (!toRemove) {
    return;
  }

  for (const header of toRemove) {
    delete headers[header.toLowerCase()];
  }
}

function applyHeaderAssignments(
  headers: Record<string, string>,
  entries?: Record<string, string | undefined>
): void {
  if (!entries) {
    return;
  }

  for (const [key, value] of Object.entries(entries)) {
    const normalizedKey = key.toLowerCase();
    if (typeof value === "string" && value.length > 0) {
      headers[normalizedKey] = value;
    } else {
      delete headers[normalizedKey];
    }
  }
}

function createFetchConfig(url: URL): {
  headers: Record<string, string>;
  userAgent: string;
} {
  const overrides = findHostOverrides(url.hostname);
  const headers: Record<string, string> = { ...HTML_FETCH_HEADERS };
  const userAgent = overrides?.userAgent ?? USER_AGENT;

  if (!overrides?.headers) {
    return {
      headers,
      userAgent,
    };
  }

  applyHeaderRemovals(headers, overrides.headers.remove);
  applyHeaderAssignments(headers, overrides.headers.set);

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
type FetchInput = Parameters<typeof fetch>[0];

const isRequestLike = (value: unknown): value is { url: string } => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { url } = value as { url?: unknown };
  return typeof url === "string" && url.length > 0;
};

const stringifiesToUrl = (value: unknown): string | null => {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { toString?: unknown }).toString !== "function"
  ) {
    return null;
  }

  try {
    const raw = (value as { toString: () => string }).toString();
    return typeof raw === "string" && !raw.startsWith("[object ") && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
};

const resolveRequestUrl = (input: FetchInput): URL => {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    return new URL(input.url);
  }

  if (isRequestLike(input)) {
    return new URL(input.url);
  }

  const stringified = stringifiesToUrl(input);
  if (stringified) {
    return new URL(stringified);
  }

  throw new UrlGuardError("Unsupported fetch input provided.", "invalid-url", 400);
};

// Apply host-specific header overrides while letting fetchPublicUrl enforce SSRF guardrails.
const hostAwareFetch: typeof fetch = async (input, init = {}) => {
  const targetUrl = resolveRequestUrl(input);
  const { headers: baseHeaders, userAgent } = createFetchConfig(targetUrl);

  const headers = new Headers(init.headers);
  const keysToReset = new Set([
    ...Object.keys(HTML_FETCH_HEADERS),
    ...Object.keys(baseHeaders),
    "user-agent",
  ]);

  keysToReset.forEach((key) => {
    headers.delete(key);
  });

  for (const [key, value] of Object.entries(baseHeaders)) {
    headers.set(key, value);
  }

  headers.set("user-agent", userAgent);

  return fetch(input, {
    ...init,
    headers,
  });
};

function ensureSuccessfulResponse(response: Response): void {
  if (!response.ok) {
    throw new UrlGuardError(
      `Request failed with status ${response.status}`,
      "fetch-failed",
      response.status
    );
  }
}

async function extractHtmlResponse(
  response: Response,
  fallbackUrl: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  try {
    const html = await response.text();
    const contentType = response.headers.get("content-type");
    const finalUrl = response.url || fallbackUrl.toString();

    return {
      html,
      contentType,
      finalUrl,
    };
  } catch (error) {
    if (error instanceof UrlGuardError) {
      throw error;
    }

    throw new UrlGuardError("Failed to fetch URL.", "fetch-failed", 502, { cause: error });
  }
}

async function fetchHtml(
  url: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  const response = await fetchPublicUrl(
    url,
    {},
    {
      ...PUBLIC_URL_OPTIONS,
      timeoutMs: FETCH_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      fetchImpl: hostAwareFetch,
    }
  );

  ensureSuccessfulResponse(response);

  return extractHtmlResponse(response, url);
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
  const rawUrl = request.nextUrl.searchParams.get("url");

  const ensTarget = detectEnsTarget(rawUrl);
  if (ensTarget) {
    try {
      const preview = await fetchEnsPreview(ensTarget);
      return NextResponse.json(preview);
    } catch (error) {
      if (error instanceof EnsPreviewError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      const message = error instanceof Error ? error.message : "Failed to fetch ENS preview";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  let targetUrl: URL;

  try {
    targetUrl = parsePublicUrl(rawUrl);
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
