import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/Auth";
import { ProfileAvailableDropRateResponse } from "../../entities/IProfile";
import FeedWrapper from "./feed/FeedWrapper";
import { TypedFeedItem } from "../../types/feed.types";

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
    <div className="tailwind-scope tw-pt-8 tw-pb-14 lg:tw-pb-24 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
      <div className="tw-flex tw-gap-x-5">
        <div className="tw-w-1/5"></div>
        <div className="tw-w-[672px] tw-flex-shrink-0 tw-mx-auto">
          <h1 className="tw-block tw-float-none tw-text-[2.5rem]">Stream</h1>
          <div className="tw-mt-4 lg:tw-mt-6">
            {/* {items.length && !isFetching && (
              <div className="tw-text-base tw-text-iron-400 tw-font-normal">
                <p className="tw-text-lg tw-text-iron-400 tw-font-normal">
                  Engage with the community and get started by{" "}
                  <span className="tw-text-primary-400 tw-font-semibold">
                    joining or creating a Wave!
                  </span>
                </p>
                <div className="tw-mt-6 tw-flex tw-items-center tw-gap-x-3">
                  <button
                    type="button"
                    className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-400 tw-bg-iron-950 tw-rounded-lg tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-primary-400 tw-shadow-sm  hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
                  >
                    <span>Explore Waves</span>
                    <svg
                      className="tw-size-5 tw-ml-1.5 -tw-mr-1 tw-flex-shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                      />
                    </svg>
                  </button>
                  <span>or</span>
                  <button
                    type="button"
                    className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
                  >
                    <svg
                      className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Create a Wave</span>
                  </button>
                </div>
              </div>
            )} */}
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
        <div className="tw-mt-16 tw-w-1/4">
          <button
            type="button"
            className="tw-w-full tw-justify-center tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Create a Wave</span>
          </button>
          <div className="tw-mt-4">
            <div className="tw-bg-iron-900 tw-py-5 tw-px-4 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-shadow-lg">
              <p className="tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
                Popular Waves
              </p>
              <div className="tw-flex tw-flex-col tw-space-y-4">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-font-semibold tw-text-base">
                  <img
                    src="#"
                    alt="#"
                    className="tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
                  />
                  <span>Memes-Chat</span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-font-semibold tw-text-base">
                  <img
                    src="#"
                    alt="#"
                    className="tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
                  />
                  <span>Memes-Chat</span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-font-semibold tw-text-base">
                  <img
                    src="#"
                    alt="#"
                    className="tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
                  />
                  <span>Memes-Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
