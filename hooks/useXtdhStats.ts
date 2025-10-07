import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { XtdhStatsError, XtdhStatsResponse } from "@/types/xtdh";

interface UseXtdhStatsOptions {
  readonly profile: string | null;
  readonly enabled?: boolean;
}

async function fetchXtdhStats(profile: string): Promise<XtdhStatsResponse> {
  const response = await fetch(
    `/api/profiles/${encodeURIComponent(profile)}/xtdh/stats`
  );

  if (!response.ok) {
    let message = "Failed to load xTDH stats";

    try {
      const errorBody = (await response.json()) as Partial<XtdhStatsError>;
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // noop: ignore parsing errors and use fallback message
    }

    throw new Error(message);
  }

  return (await response.json()) as XtdhStatsResponse;
}

export function useXtdhStats({
  profile,
  enabled = true,
}: UseXtdhStatsOptions) {
  return useQuery<XtdhStatsResponse, Error>({
    queryKey: [QueryKey.XTDH_STATS, profile],
    queryFn: async () => {
      if (!profile) {
        throw new Error("Profile is required to fetch xTDH stats");
      }

      return await fetchXtdhStats(profile);
    },
    enabled: Boolean(profile) && enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1_000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
