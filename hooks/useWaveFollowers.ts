"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getWaveFollowersCountQueryKey } from "@/hooks/useWaveFollowersCount";
const REQUEST_SIZE = 100;

export function useWaveFollowers(waveId: string) {
  const queryClient = useQueryClient();
  const query = {
    page_size: `${REQUEST_SIZE}`,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.WAVE_FOLLOWERS,
      {
        ...query,
        target_type: "WAVE",
        wave_id: waveId,
      },
    ],
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number | null;
      signal: AbortSignal;
    }) => {
      const params: Record<string, string> = {
        ...query,
      };
      if (pageParam) {
        params["page"] = `${pageParam}`;
      }
      const page = await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `identity-subscriptions/incoming/WAVE/${waveId}`,
        params,
        signal,
      });
      // The endpoint total is independent of page size. Keep About aligned
      // with the latest list response without another count request.
      queryClient.setQueryData(
        getWaveFollowersCountQueryKey(waveId),
        page.count
      );
      return page;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
  });

  const [followers, setFollowers] = useState<
    ApiIdentityAndSubscriptionActions[]
  >([]);
  useEffect(
    () => setFollowers(data?.pages.flatMap((page) => page.data) ?? []),
    [data]
  );

  const onBottomIntersection = (state: boolean) => {
    if (followers.length < REQUEST_SIZE) {
      return;
    }
    if (
      !state ||
      status === "pending" ||
      isFetching ||
      isFetchingNextPage ||
      !hasNextPage
    ) {
      return;
    }
    fetchNextPage();
  };

  return {
    followers,
    isFetching,
    onBottomIntersection,
  };
}
