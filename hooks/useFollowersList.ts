import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const REQUEST_SIZE = 100;

export default function useFollowersList({
  profileId,
  enabled = true,
}: {
  readonly profileId: string | null | undefined;
  readonly enabled?: boolean;
}) {
  const query = { page_size: `${REQUEST_SIZE}` };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.IDENTITY_FOLLOWERS,
      {
        ...query,
        target_type: "IDENTITY",
        profile_id: profileId,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = { ...query };
      if (pageParam) {
        params["page"] = `${pageParam}`;
      }
      return await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `/identity-subscriptions/incoming/IDENTITY/${profileId}`,
        params,
      });
    },
    enabled: !!profileId && enabled,
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
    if (followers.length < REQUEST_SIZE) return;
    if (!state) return;
    if (status === "pending") return;
    if (isFetching) return;
    if (isFetchingNextPage) return;
    if (!hasNextPage) return;
    fetchNextPage();
  };

  return { followers, isFetching, onBottomIntersection };
}
