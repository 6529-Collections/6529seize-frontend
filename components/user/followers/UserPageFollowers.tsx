"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { useEffect, useState } from "react";
import { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const REQUEST_SIZE = 100;

type Query = {
  readonly page_size: string;
};

export default function UserPageFollowers({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const query: Query = {
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
      QueryKey.IDENTITY_FOLLOWERS,
      {
        ...query,
        target_type: "IDENTITY",
        profile_id: profile.id,
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
        endpoint: `/identity-subscriptions/incoming/IDENTITY/${profile.id}`,
        params,
      });
    },
    enabled: !!profile.id,
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
    if (!state) {
      return;
    }
    if (status === "pending") {
      return;
    }
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    fetchNextPage();
  };

  return (
    <div className="tailwind-scope">
      <FollowersListWrapper
        followers={followers}
        loading={isFetching}
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
}
