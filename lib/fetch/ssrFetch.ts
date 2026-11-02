import { publicEnv } from "@/config/env";
import { isProductionBuildPhase } from "@/config/nextPhase";
import { getServerEnvOrThrow, getStagingApiKey } from "@/config/serverEnv";
import { API_AUTH_COOKIE } from "@/constants/constants";
import {
  generateClientSignature,
  generateWafSignature,
} from "@/helpers/server-signature.helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  bindResponseDeadline,
  createFetchDeadline,
  discardResponse,
} from "@/lib/fetch/fetchDeadline";

/**
 * Longest a server render waits on the first-party API, from request start to
 * the last byte of the response. Without it a slow API holds the render for
 * undici's ~300 s default.
 */
export const SSR_API_TIMEOUT_MS = 4500;

const getOriginalFetch = (): typeof fetch => {
  if (globalThis.fetch === undefined) {
    throw new TypeError(
      "fetch not available in current runtime. This module requires a fetch implementation."
    );
  }
  if (typeof globalThis.fetch !== "function") {
    throw new TypeError(
      "fetch is not a function in current runtime. Expected a function but got a different type."
    );
  }
  return globalThis.fetch;
};

const originalFetch = getOriginalFetch();

const isApiRequest = (url: string | URL): boolean => {
  const urlString = typeof url === "string" ? url : url.toString();
  try {
    const parsedUrl = new URL(urlString, publicEnv.API_ENDPOINT);
    return parsedUrl.origin === new URL(publicEnv.API_ENDPOINT).origin;
  } catch {
    return false;
  }
};

const extractPathFromUrl = (url: string | URL, baseUrl: string): string => {
  const urlString = typeof url === "string" ? url : url.toString();
  try {
    const parsedUrl = new URL(urlString, baseUrl);
    return parsedUrl.pathname + parsedUrl.search;
  } catch {
    return "";
  }
};

// Keep only the API family (for example `GET /api/identities/*`). Identifiers
// and query strings never reach the logs.
const describeRequestForLog = (method: string, path: string): string => {
  const segments = (path.split("?", 1)[0] ?? "").split("/").filter(Boolean);
  const family = segments.slice(0, 2).join("/");
  return `${method} /${family}${segments.length > 2 ? "/*" : ""}`;
};

// Next.js memoizes identical GET/HEAD requests within a render, but skips any
// call that carries `init.signal`. Its own patched fetch folds `init` into a
// Request for the same reason, so hand it the Request directly: the deadline
// still cancels the transfer and memoization keeps working. A signal supplied
// by the caller already opted that call out, so it keeps the plain form.
const sendWithSignal = (
  input: RequestInfo | URL,
  init: RequestInit,
  signal: AbortSignal,
  method: string
): Promise<Response> => {
  const keepsMemoization =
    (method === "GET" || method === "HEAD") && !init.signal;
  if (!keepsMemoization) {
    return originalFetch(input, { ...init, signal });
  }
  const { next, ...overrides } = init;
  return originalFetch(
    new Request(input, { ...overrides, signal }),
    next ? { next } : undefined
  );
};

/**
 * Runs a first-party API request under one deadline covering the response
 * headers and body. The caller's own signal still cancels it, and the timer is
 * released as soon as the body is consumed or the request fails.
 */
const fetchApiWithDeadline = async (
  input: RequestInfo | URL,
  init: RequestInit,
  method: string,
  path: string
): Promise<Response> => {
  // Static generation and other build-time work may legitimately wait longer
  // than a live render can.
  if (isProductionBuildPhase()) {
    return originalFetch(input, init);
  }

  let awaitingHeaders = true;
  const callerSignal =
    init.signal === undefined && input instanceof Request
      ? input.signal
      : init.signal;
  const deadline = createFetchDeadline(callerSignal, SSR_API_TIMEOUT_MS, () => {
    // A body nobody reads is cancelled quietly; only a silent API is worth a log.
    if (awaitingHeaders) {
      console.warn(
        `[SSR Fetch] 6529 API request exceeded ${SSR_API_TIMEOUT_MS}ms (${describeRequestForLog(method, path)}).`
      );
    }
    return new DOMException(
      `The 6529 API did not respond within ${SSR_API_TIMEOUT_MS}ms.`,
      "TimeoutError"
    );
  });

  let response: Response | undefined;
  try {
    response = await deadline.run(async () => {
      const result = await sendWithSignal(input, init, deadline.signal, method);
      if (deadline.signal.aborted) {
        discardResponse(result);
        throw deadline.signal.reason;
      }
      return result;
    });
    awaitingHeaders = false;
    return bindResponseDeadline(response, deadline);
  } catch (error) {
    deadline.dispose();
    if (response) discardResponse(response);
    throw error;
  }
};

// Server-held staging access fills in only when the caller sent none; the
// signed path still prefers the visitor's own access cookie.
const applyServerStagingAccess = (headers: Headers): void => {
  const stagingApiKey = getStagingApiKey();
  if (stagingApiKey && !headers.has(API_AUTH_COOKIE)) {
    headers.set(API_AUTH_COOKIE, stagingApiKey);
  }
};

// fetch keeps custom headers across redirects, including cross-origin ones, so
// a request that still carries the server staging key never follows one.
const withServerKeyRedirectGuard = (
  init: RequestInit | undefined,
  headers: Headers
): RequestInit => {
  const stagingApiKey = getStagingApiKey();
  const carriesServerKey =
    stagingApiKey !== undefined &&
    headers.get(API_AUTH_COOKIE) === stagingApiKey;
  return {
    ...init,
    headers,
    ...(carriesServerKey && init?.redirect !== "manual"
      ? { redirect: "error" as const }
      : {}),
  };
};

const createSsrFetch =
  (includeWalletAuth: boolean): typeof fetch =>
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (Reflect.has(globalThis, "window")) {
      return originalFetch(input, init);
    }

    let url: string;
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = input.url;
    }

    if (!isApiRequest(url)) {
      return originalFetch(input, init);
    }

    let clientId: string;
    let clientSecret: string;

    const method = (
      init?.method ??
      (input instanceof Request ? input.method : undefined) ??
      "GET"
    ).toUpperCase();
    const path = extractPathFromUrl(url, publicEnv.API_ENDPOINT);

    if (!path) {
      return originalFetch(input, init);
    }

    const baseHeaders = input instanceof Request ? input.headers : undefined;
    const enhancedHeaders = new Headers(baseHeaders);
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        enhancedHeaders.set(key, value);
      });
    }
    if (!includeWalletAuth) {
      enhancedHeaders.delete("Authorization");
    }
    applyServerStagingAccess(enhancedHeaders);

    try {
      const env = getServerEnvOrThrow();
      clientId = env.SSR_CLIENT_ID;
      clientSecret = env.SSR_CLIENT_SECRET;
    } catch {
      console.warn(
        `[SSR Fetch] [PATH: ${path}] SSR credentials unavailable, falling back to unauthenticated fetch. Internal rate limits will not be bypassed.`
      );
      return fetchApiWithDeadline(
        input,
        withServerKeyRedirectGuard(init, enhancedHeaders),
        method,
        path
      );
    }

    const signatureData = generateClientSignature(
      clientId,
      clientSecret,
      method,
      path
    );

    const wafSignature = generateWafSignature(clientId, clientSecret);

    enhancedHeaders.set("x-6529-internal-id", signatureData.clientId);
    enhancedHeaders.set("x-6529-internal-signature", signatureData.signature);
    enhancedHeaders.set(
      "x-6529-internal-timestamp",
      signatureData.timestamp.toString()
    );
    enhancedHeaders.set("x-6529-internal-waf-signature", wafSignature);

    try {
      const appHeaders = await getAppCommonHeaders();
      Object.entries(appHeaders).forEach(([key, value]) => {
        if (!includeWalletAuth && key.toLowerCase() === "authorization") {
          return;
        }
        enhancedHeaders.set(key, value);
      });
    } catch (error) {
      console.warn(
        `[SSR Fetch] [PATH: ${path}] Failed to get app common headers:`,
        error instanceof Error ? error.message : error
      );
    }

    return fetchApiWithDeadline(
      input,
      withServerKeyRedirectGuard(init, enhancedHeaders),
      method,
      path
    );
  };

const enhancedFetch = createSsrFetch(true);
const anonymousSsrFetch = createSsrFetch(false);

if (globalThis.window === undefined) {
  globalThis.fetch = enhancedFetch;
}

export { anonymousSsrFetch, enhancedFetch as ssrFetch };
