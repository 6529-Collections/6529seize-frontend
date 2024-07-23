import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/Auth";
import { ProfileAvailableDropRateResponse } from "../../entities/IProfile";
import FeedWrapper from "./feed/FeedWrapper";
import { TypedFeedItem } from "../../types/feed.types";

const REQUEST_SIZE = 20;

export default function Brain() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowFeed = () =>
    !!connectedProfile?.profile?.handle &&
    connectedProfile.level >= 0 &&
    !activeProfileProxy;

  const [showFeed, setShowFeed] = useState(getShowFeed());
  useEffect(
    () => setShowFeed(getShowFeed()),
    [connectedProfile, activeProfileProxy]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.FEED_ITEMS],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {};
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
  });

  const [items, setItems] = useState<TypedFeedItem[]>([]);

  useEffect(() => setItems(data?.pages.flat() ?? []), [data]);

  const onBottomIntersection = (state: boolean) => {
    if (items.length < REQUEST_SIZE) {
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

  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle && !activeProfileProxy,
    });

  if (!showFeed) {
    return null;
  }

  return (
    <div className="tailwind-scope">
      <div>
        <div className="tw-max-w-2xl tw-mx-auto tw-pt-8 tw-pb-12">
          <h1 className="tw-block tw-float-none">Stream</h1>
          <div className="tw-mt-4 lg:tw-mt-6">
            {!items.length && !isFetching && (
              <div className="tw-text-sm tw-italic tw-text-iron-500">
                No Feed to show
              </div>
            )}
            <FeedWrapper
              items={items}
              loading={isFetching}
              showWaveInfo={true}
              availableCredit={
                availableRateResponse?.available_credit_for_rating ?? null
              }
              onBottomIntersection={onBottomIntersection}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
