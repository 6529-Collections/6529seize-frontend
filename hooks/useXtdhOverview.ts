import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { XtdhOverviewStats } from "@/types/xtdh";

function fetchJson<T>(input: RequestInfo | URL): Promise<T> {
  return fetch(input).then(async (response) => {
    if (!response.ok) {
      let message = "Unable to load xTDH data";
      try {
        const body = (await response.json()) as { message?: string };
        if (body?.message) {
          message = body.message;
        }
      } catch {
        // ignore errors parsing body
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  });
}

export function useXtdhOverviewStats(
  enabled: boolean = true
): UseQueryResult<XtdhOverviewStats, Error> {
  return useQuery<XtdhOverviewStats, Error>({
    queryKey: [QueryKey.XTDH_OVERVIEW_STATS],
    queryFn: async () => await fetchJson<XtdhOverviewStats>("/api/xtdh/stats"),
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
  });
}
