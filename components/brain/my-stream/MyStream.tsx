import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { TypedFeedItem } from "../../../types/feed.types";
import { ProfileAvailableDropRateResponse } from "../../../entities/IProfile";
import FeedWrapper from "../feed/FeedWrapper";
import MyStreamNoItems from "./layout/MyStreamNoItems";

export default function MyStream() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

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
    placeholderData: keepPreviousData,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
  });

  const [items, setItems] = useState<TypedFeedItem[]>([]);

  useEffect(() => setItems(data?.pages.flat() ?? []), [data]);

  const onBottomIntersection = (state: boolean) => {
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
  return (
    <div className="lg:tw-w-[672px] tw-flex-shrink-0">

      {/*  <CreateDropContent /> */}

     {/*  <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2 tw-items-center"> */}
        {/*  ACTIVE STATE: tw-ring-primary-400 hover:tw-ring-primary-300 hover:tw-to-iron-900 tw-bg-gradient-to-b tw-from-iron-900 tw-to-iron-950 tw-text-iron-50  */}
       {/*  <button
          type="button"
          className="tw-ring-primary-400 hover:tw-ring-primary-300 hover:tw-to-iron-900 tw-bg-gradient-to-b tw-from-iron-900 tw-to-iron-950 tw-text-iron-50 tw-ring-inset tw-ring-1 tw-border-0 tw-rounded-full tw-bg-iron-950 tw-px-3 tw-py-2.5 0 tw-font-medium tw-text-sm tw-shadow-md tw-transition tw-duration-300 tw-ease-out"
        >
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <img
              src="#"
              alt="#"
              className="tw-flex-shrink-0 tw-object-contain tw-h-4 tw-w-4 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
            />
            <span className="tw-whitespace-nowrap">Memes Chat</span>
          </div>
        </button> */}
        {/*  NOT ACTIVE STATE: tw-ring-iron-800 hover:tw-ring-iron-700 hover:tw-bg-iron-900 hover:tw-text-iron-300 tw-text-iron-400  */}
        {/* <button
          type="button"
          className="tw-ring-iron-800 hover:tw-ring-iron-700 hover:tw-bg-iron-900 hover:tw-text-iron-300 tw-text-iron-400 tw-ring-inset tw-ring-1 tw-border-0 tw-rounded-full tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-font-medium tw-text-sm tw-transition tw-duration-300 tw-ease-out"
        >
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <img
              src="#"
              alt="#"
              className="tw-flex-shrink-0 tw-object-contain tw-h-4 tw-w-4 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
            />
            <span className="tw-whitespace-nowrap">6529 Team</span>
          </div>
        </button> */}
      {/* </div> */}

      <div>
        {!items.length && !isFetching ? (
          <MyStreamNoItems />
        ) : (
          <>
            <div>
              <FeedWrapper
                items={items}
                loading={isFetching}
                showWaveInfo={true}
                availableCredit={
                  availableRateResponse?.available_credit_for_rating ?? null
                }
                onBottomIntersection={onBottomIntersection}
              />
            </div>{" "}
          </>
        )}
      </div>
    </div>
  );
}
