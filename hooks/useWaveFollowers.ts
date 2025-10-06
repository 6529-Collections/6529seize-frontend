"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
const REQUEST_SIZE = 100;

export function useWaveFollowers(waveId: string) {
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
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        ...query,
      };
      if (pageParam) {
        params.page = `${pageParam}`;
      }
      return await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `/identity-subscriptions/incoming/WAVE/${waveId}`,
        params,
      });
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
