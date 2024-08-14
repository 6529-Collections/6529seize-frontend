import { useInfiniteQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { IncomingIdentitySubscriptionsPage } from "../../../generated/models/IncomingIdentitySubscriptionsPage";
import { useEffect, useState } from "react";
import { IdentityAndSubscriptionActions } from "../../../generated/models/IdentityAndSubscriptionActions";
import FollowersListWrapper from "../../utils/followers/FollowersListWrapper";
const REQUEST_SIZE = 100;

type Query = {
  readonly page_size: string;
};

export default function UserPageFollowers({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
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
        profile_id: profile.profile?.external_id,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        ...query,
      };
      if (pageParam) {
        params.page = `${pageParam}`;
      }
      return await commonApiFetch<IncomingIdentitySubscriptionsPage>({
        endpoint: `/identity-subscriptions/incoming/IDENTITY/${profile.profile?.external_id}`,
        params,
      });
    },
    enabled: !!profile.profile?.external_id,
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
  });

  const [followers, setFollowers] = useState<IdentityAndSubscriptionActions[]>(
    []
  );
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
