"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiActiveWaveVotesPage } from "@/generated/models/ApiActiveWaveVotesPage";
import { commonApiFetch } from "@/services/api/common-api";
import { useWaveDiscoveryViewer } from "./useWaveDiscoveryViewer";

export function useActiveWaveVotes(pageSize = 20) {
  const viewer = useWaveDiscoveryViewer();
  const query = useInfiniteQuery({
    queryKey: [QueryKey.ACTIVE_WAVE_VOTES, viewer.key, pageSize],
    queryFn: ({ pageParam, signal }) =>
      commonApiFetch<ApiActiveWaveVotesPage>({
        endpoint: "v2/waves/active-votes",
        params: { page: String(pageParam), page_size: String(pageSize) },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    enabled: viewer.enabled,
    refetchInterval: 60_000,
    ...getDefaultQueryRetry(),
  });
  return { ...query, data: viewer.enabled ? query.data : undefined };
}
