import { publicEnv } from "@/config/env";
import { getServerEnvOrThrow } from "@/config/serverEnv";
import {
  generateClientSignature,
  generateWafSignature,
} from "@/helpers/server-signature.helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";

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

const enhancedFetch: typeof fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  if (globalThis.window !== undefined) {
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

  try {
    const env = getServerEnvOrThrow();
    clientId = env.SSR_CLIENT_ID;
    clientSecret = env.SSR_CLIENT_SECRET;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const missingVars: string[] = [];
    
    if (errorMessage.includes("SSR_CLIENT_ID")) {
      missingVars.push("SSR_CLIENT_ID");
    }
    if (errorMessage.includes("SSR_CLIENT_SECRET")) {
      missingVars.push("SSR_CLIENT_SECRET");
    }
    
    const missingVarsList = missingVars.length > 0 
      ? ` Missing env vars: ${missingVars.join(", ")}`
      : "";
    
    console.error(
      `[SSR Fetch] Failed to get SSR credentials.${missingVarsList} Error: ${errorMessage}. Falling back to original fetch (requests will bypass rate limits).`
    );
    
    return originalFetch(input, init);
  }

  const method = (
    init?.method ??
    (input instanceof Request ? input.method : undefined) ??
    "GET"
  ).toUpperCase();
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

  const wafSignature = generateWafSignature(clientId, clientSecret);

  const baseHeaders = input instanceof Request ? input.headers : undefined;
  const enhancedHeaders = new Headers(baseHeaders);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      enhancedHeaders.set(key, value);
    });
  }

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
      enhancedHeaders.set(key, value);
    });
  } catch {}

  const headerKeys = Array.from(enhancedHeaders.keys());
  console.log(`[SSR Fetch] Request headers: ${headerKeys.join(", ")}`);

  return originalFetch(input, {
    ...init,
    headers: enhancedHeaders,
  });
};

if (globalThis.window === undefined) {
  globalThis.fetch = enhancedFetch;
}

export { enhancedFetch as ssrFetch };
