import { publicEnv } from "@/config/env";

const LOCAL_REQUEST_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

// Matches the build-baked development checks in config/nextConfig.ts.
const isLocalDevelopment = (): boolean =>
  publicEnv.NODE_ENV === "development" || publicEnv.NODE_ENV === "local";

/**
 * Origin used to build the image-proxy URLs embedded in a card. The request
 * host is client-controlled, so only loopback hosts are honored, and only when
 * running the local development server. Every other environment resolves to
 * the configured public base URL.
 */
export const getOgImageRequestOrigin = (request: Request): string => {
  if (!isLocalDevelopment()) {
    return publicEnv.BASE_ENDPOINT;
  }

  try {
    const requestUrl = new URL(request.url);

    if (LOCAL_REQUEST_HOSTS.has(requestUrl.hostname)) {
      return requestUrl.origin;
    }
  } catch {
    return publicEnv.BASE_ENDPOINT;
  }

  return publicEnv.BASE_ENDPOINT;
};
