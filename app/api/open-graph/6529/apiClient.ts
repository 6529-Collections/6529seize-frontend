import { createHash } from "node:crypto";

import { publicEnv } from "@/config/env";

const PUBLIC_API_BASE = "https://api.6529.io";

export type ApiContext = {
  readonly apiAuth?: string | null | undefined;
};

export type ApiPage<T> = {
  readonly data?: readonly T[] | null | undefined;
};

type ApiQueryParams = Record<string, string | number | undefined>;

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(0, end);
}

function trimLeadingSlashes(value: string): string {
  let start = 0;
  while (start < value.length && value[start] === "/") {
    start += 1;
  }

  return value.slice(start);
}

function getApiBase(): string {
  const base = publicEnv.API_ENDPOINT?.trim();
  if (!base) {
    throw new Error("API endpoint is not configured.");
  }
  return trimTrailingSlashes(base);
}

function buildApiUrl(
  base: string,
  endpoint: string,
  params?: ApiQueryParams
): string {
  const url = new URL(`/api/${trimLeadingSlashes(endpoint)}`, `${base}/`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function normalizeApiOrigin(base: string): string {
  try {
    const url = new URL(`${trimTrailingSlashes(base)}/`);
    return url.origin.toLowerCase();
  } catch {
    return trimTrailingSlashes(base).toLowerCase();
  }
}

function getApiBases(): readonly string[] {
  const primary = getApiBase();
  if (normalizeApiOrigin(primary) === normalizeApiOrigin(PUBLIC_API_BASE)) {
    return [primary];
  }

  return [primary, PUBLIC_API_BASE];
}

function getCallerApiAuth(context?: ApiContext): string | undefined {
  const apiAuth = context?.apiAuth?.trim();
  return apiAuth || undefined;
}

function getApiAuth(context?: ApiContext): string | undefined {
  return (
    getCallerApiAuth(context) ?? publicEnv.STAGING_API_KEY?.trim() ?? undefined
  );
}

function hashCacheToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 24);
}

export function getCacheAuthScope(context?: ApiContext): string {
  const callerAuth = getCallerApiAuth(context);
  if (callerAuth) {
    return `auth:${hashCacheToken(callerAuth)}`;
  }

  return publicEnv.STAGING_API_KEY?.trim() ? "staging" : "public";
}

function createApiHeaders(context?: ApiContext): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  const apiAuth = getApiAuth(context);

  if (apiAuth) {
    headers["x-6529-auth"] = apiAuth;
  }

  return headers;
}

const PUBLIC_API_HEADERS: HeadersInit = {
  accept: "application/json",
};

function hasApiAuth(context?: ApiContext): boolean {
  return getApiAuth(context) !== undefined;
}

function shouldRetryApiStatus(status: number, context?: ApiContext): boolean {
  if (status >= 500 && status < 600) {
    return true;
  }

  return (status === 401 || status === 403) && !hasApiAuth(context);
}

async function getApiFetch(): Promise<typeof fetch> {
  if (typeof window !== "undefined") {
    return fetch;
  }

  try {
    const { ssrFetch } = await import("@/lib/fetch/ssrFetch");
    return ssrFetch;
  } catch {
    // Preview enrichment should degrade to public API data if server signing is unavailable.
    return fetch;
  }
}

async function fetchApiJson<T>(
  endpoint: string,
  params?: ApiQueryParams,
  context?: ApiContext
): Promise<T> {
  const fetchImpl = await getApiFetch();
  const bases = getApiBases();
  let lastStatus: number | undefined;
  let primaryStatus: number | undefined;
  let lastError: unknown;

  for (const [index, base] of bases.entries()) {
    try {
      const response = await fetchImpl(buildApiUrl(base, endpoint, params), {
        headers: index === 0 ? createApiHeaders(context) : PUBLIC_API_HEADERS,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      lastStatus = response.status;
      if (index === 0) {
        primaryStatus = response.status;
      }

      if (!shouldRetryApiStatus(response.status, context)) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  const status = primaryStatus ?? lastStatus;
  if (status !== undefined) {
    throw new Error(`6529 API request failed with status ${status}.`);
  }

  throw new Error("6529 API request failed.", {
    cause: lastError,
  });
}

export async function fetchOptionalApiJson<T>(
  endpoint: string,
  params?: ApiQueryParams,
  context?: ApiContext
): Promise<T | null> {
  try {
    return await fetchApiJson<T>(endpoint, params, context);
  } catch {
    return null;
  }
}

export async function fetchFirstPageItem<T>(
  endpoint: string,
  params?: ApiQueryParams,
  context?: ApiContext
): Promise<T | null> {
  const page = await fetchOptionalApiJson<ApiPage<T>>(
    endpoint,
    params,
    context
  );
  return page?.data?.[0] ?? null;
}
