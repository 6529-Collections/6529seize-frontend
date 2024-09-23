import { useInfiniteQuery } from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { IncomingIdentitySubscriptionsPage } from "../../../../generated/models/IncomingIdentitySubscriptionsPage";
import { useEffect, useState } from "react";
import { IdentityAndSubscriptionActions } from "../../../../generated/models/IdentityAndSubscriptionActions";
import FollowersListWrapper from "../../../utils/followers/FollowersListWrapper";

const REQUEST_SIZE = 100;

type Query = {
  readonly page_size: string;
};

export default function WaveDetailedFollowers({
  wave,
  onBackClick,
}: {
  readonly wave: Wave;
  readonly onBackClick: () => void;
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
      QueryKey.WAVE_FOLLOWERS,
      {
        ...query,
        target_type: "WAVE",
        wave_id: wave.id,
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
        endpoint: `/identity-subscriptions/incoming/WAVE/${wave.id}`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.next ? lastPage.page + 1 : null),
  });

  const [followers, setFollowers] = useState<IdentityAndSubscriptionActions[]>(
    []
  );
  useEffect(() => setFollowers(data?.pages.flatMap(page => page.data) ?? []), [data]);

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
    <div className="tw-px-4 tw-py-4">
      <button
        onClick={onBackClick}
        className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
      >
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12H4M4 12L10 18M4 12L10 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        <span>Back</span>
      </button>
      <div className="tw-mt-2">
        <div className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
          Followers
        </div>

      <FollowersListWrapper followers={followers} loading={isFetching} onBottomIntersection={onBottomIntersection} />
      </div>
    </div>
  );
}
