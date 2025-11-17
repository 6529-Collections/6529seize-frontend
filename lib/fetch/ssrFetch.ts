import { publicEnv } from "@/config/env";
import { getServerEnvOrThrow } from "@/config/serverEnv";
import { generateClientSignature } from "@/helpers/server-signature.helpers";

const getOriginalFetch = (): typeof fetch => {
  if (typeof globalThis.fetch === "undefined") {
    throw new Error(
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

const enhancedFetch: typeof fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const originalFetch = getOriginalFetch();

  if (typeof globalThis.window !== "undefined") {
    return originalFetch(input, init);
  }

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  if (!isApiRequest(url)) {
    return originalFetch(input, init);
  }

  let clientId: string;
  let clientSecret: string;

  try {
    const env = getServerEnvOrThrow();
    clientId = env.SSR_CLIENT_ID;
    clientSecret = env.SSR_CLIENT_SECRET;
  } catch {
    return originalFetch(input, init);
  }

  const method =
    init?.method?.toUpperCase() ??
    (input instanceof Request ? input.method.toUpperCase() : "GET");
  const path = extractPathFromUrl(url, publicEnv.API_ENDPOINT);

  if (!path) {
    return originalFetch(input, init);
  }

  const signatureData = generateClientSignature(
    clientId,
    clientSecret,
    method,
    path
  );

  const enhancedHeaders =
    input instanceof Request ? new Headers(input.headers) : new Headers();

  if (init?.headers) {
    const initHeaders = new Headers(init.headers);
    initHeaders.forEach((value, key) => {
      enhancedHeaders.set(key, value);
    });
  }

  enhancedHeaders.set("x-6529-internal-id", signatureData.clientId);
  enhancedHeaders.set("x-6529-internal-signature", signatureData.signature);
  enhancedHeaders.set(
    "x-6529-internal-timestamp",
    signatureData.timestamp.toString()
  );

  return originalFetch(input, {
    ...init,
    headers: enhancedHeaders,
  });
};

if (typeof globalThis.window === "undefined") {
  globalThis.fetch = enhancedFetch;
}

export { enhancedFetch as ssrFetch };
