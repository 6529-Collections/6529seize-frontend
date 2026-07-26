"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

export function useSubscriptionCoverage({
  enabled = true,
  profileKey,
}: {
  readonly enabled?: boolean;
  readonly profileKey: string | undefined;
}) {
  return useQuery<ApiSubscriptionCoverage>({
    queryKey: [QueryKey.SUBSCRIPTION_COVERAGE, profileKey],
    queryFn: async ({ signal }) =>
      await commonApiFetch<ApiSubscriptionCoverage>({
        endpoint: `subscriptions/consolidation/coverage/${profileKey}`,
        cache: "no-store",
        signal,
      }),
    enabled: enabled && !!profileKey,
    retry: false,
    staleTime: 30_000,
  });
}
