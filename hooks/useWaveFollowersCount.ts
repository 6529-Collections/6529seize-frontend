"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { commonApiFetch } from "@/services/api/common-api";

export const getWaveFollowersCountQueryKey = (waveId: string) =>
  [QueryKey.WAVE_FOLLOWERS, { wave_id: waveId }, "count"] as const;

export function useWaveFollowersCount(waveId: string) {
  return useQuery({
    queryKey: getWaveFollowersCountQueryKey(waveId),
    queryFn: async ({ signal }) => {
      const page = await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `/identity-subscriptions/incoming/WAVE/${waveId}`,
        params: { page_size: "1" },
        signal,
      });
      return page.count;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
