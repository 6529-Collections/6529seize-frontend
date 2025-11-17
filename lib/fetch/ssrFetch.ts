import { publicEnv } from "@/config/env";
import { getServerEnvOrThrow } from "@/config/serverEnv";
import { generateClientSignature } from "@/helpers/server-signature.helpers";

const originalFetch = globalThis.fetch;

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

  const method = init?.method?.toUpperCase() ?? "GET";
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

  const enhancedHeaders = new Headers(init?.headers);
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
