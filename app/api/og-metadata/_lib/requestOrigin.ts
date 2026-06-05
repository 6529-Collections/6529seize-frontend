import { publicEnv } from "@/config/env";

const LOCAL_REQUEST_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const getOgImageRequestOrigin = (request: Request): string => {
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
