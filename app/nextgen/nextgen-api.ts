import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";

const NOT_FOUND_STATUS = 404;

/**
 * Loads a NextGen API resource for a route. Only a real 404 resolves to `null`
 * (so the caller can render the not-found page). Every other failure, such as
 * a 5xx, timeout or network error, is rethrown so it reaches the route error
 * boundary instead of being reported (and cached) as "not found".
 */
export async function fetchNextgenOrNull<T>({
  endpoint,
  headers,
}: {
  readonly endpoint: string;
  readonly headers: Record<string, string>;
}): Promise<T | null> {
  try {
    return await commonApiFetch<T>({
      endpoint,
      headers,
      errorMode: "structured",
    });
  } catch (error) {
    if (getStructuredApiErrorStatus(error) === NOT_FOUND_STATUS) {
      return null;
    }
    throw error;
  }
}
