import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/Auth";
import { ProfileAvailableDropRateResponse } from "../../entities/IProfile";
import FeedWrapper from "./feed/FeedWrapper";
import { TypedFeedItem } from "../../types/feed.types";
import Link from "next/link";
import StreamDiscovery from "./discovery/StreamDiscovery";

export default function Brain() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowFeed = () =>
    !!(
      !!connectedProfile?.profile?.handle &&
      connectedProfile.level >= 50 &&
      !activeProfileProxy
    ) || connectedProfile?.profile?.handle === "simo";

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
      <div className="md:tw-flex tw-justify-center ">
        <div className="tw-text-iron-500 tw-text-sm tw-py-4">
          These pages are in closed alpha for level 50 and above. They are not
          ready for public release. Lots of improvements and bugs to fix.
          Currently only &quot;chat&quot; waves are active.
        </div>
      </div>

      <div className="md:tw-flex tw-justify-center tw-gap-x-5 xl:tw-ml-16">
        <div className="md:tw-w-[672px] tw-flex-shrink-0">
          <div>
            {!items.length && !isFetching ? (
              <div className="tw-mt-8">
                <span className="tw-flex-shrink-0 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-iron-700 tw-border-solid tw-h-12 tw-w-12 tw-bg-iron-950">
                  <svg
                    className="tw-h-6 tw-w-6 tw-text-iron-300 tw-flex-shrink-0"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.34119 10.875H11.409V14.625H7.34119V10.875Z"
                      fill="currentColor"
                    />
                    <path
                      d="M22.5001 7.125H48V10.875H22.5001V7.125Z"
                      fill="currentColor"
                    />
                    <path
                      d="M22.5001 14.625H37.1251V18.375H22.5001V14.625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M7.34119 33.375H11.409V37.125H7.34119V33.375Z"
                      fill="currentColor"
                    />
                    <path
                      d="M22.5001 29.625H48V33.375H22.5001V29.625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M22.5001 37.125H37.1251V40.875H22.5001V37.125Z"
                      fill="currentColor"
                    />
                    <path
                      d="M0 20.625C0 21.4534 0.671573 22.125 1.5 22.125H17.25C18.0784 22.125 18.75 21.4534 18.75 20.625V4.875C18.75 4.04657 18.0784 3.375 17.25 3.375H1.5C0.671573 3.375 0 4.04657 0 4.875V20.625ZM3.75 8.625C3.75 7.79657 4.42157 7.125 5.25 7.125H13.5C14.3284 7.125 15 7.79657 15 8.625V16.875C15 17.7034 14.3284 18.375 13.5 18.375H5.25C4.42157 18.375 3.75 17.7034 3.75 16.875V8.625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M0 43.125C0 43.9534 0.671573 44.625 1.5 44.625H17.25C18.0784 44.625 18.75 43.9534 18.75 43.125V27.375C18.75 26.5466 18.0784 25.875 17.25 25.875H1.5C0.671573 25.875 0 26.5466 0 27.375V43.125ZM3.75 31.125C3.75 30.2966 4.42157 29.625 5.25 29.625H13.5C14.3284 29.625 15 30.2966 15 31.125V39.375C15 40.2034 14.3284 40.875 13.5 40.875H5.25C4.42157 40.875 3.75 40.2034 3.75 39.375V31.125Z"
                      fill="currentColor"
                    />
                  </svg>

                  <div className="tw-absolute">
                    <svg
                      width="336"
                      height="336"
                      viewBox="0 0 336 336"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <mask
                        id="mask0_8902_8329"
                        style={{ maskType: "alpha" }}
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="336"
                        height="336"
                      >
                        <rect
                          width="336"
                          height="336"
                          fill="url(#paint0_radial_8902_8329)"
                        />
                      </mask>
                      <g mask="url(#mask0_8902_8329)">
                        <circle cx="168" cy="168" r="47.5" stroke="#1F242F" />
                        <circle cx="168" cy="168" r="47.5" stroke="#1F242F" />
                        <circle cx="168" cy="168" r="71.5" stroke="#1F242F" />
                        <circle cx="168" cy="168" r="95.5" stroke="#1F242F" />
                        <circle cx="168" cy="168" r="119.5" stroke="#1F242F" />
                        <circle cx="168" cy="168" r="143.5" stroke="#1F242F" />
                        <circle cx="168" cy="168" r="167.5" stroke="#1F242F" />
                      </g>
                      <defs>
                        <radialGradient
                          id="paint0_radial_8902_8329"
                          cx="0"
                          cy="0"
                          r="1"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="translate(168 168) rotate(90) scale(168 168)"
                        >
                          <stop />
                          <stop offset="1" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                    </svg>
                  </div>
                </span>
                <div className="tw-mt-8 tw-relative tw-z-10">
                  <h1 className="tw-relative tw-z-10 tw-block tw-float-none tw-text-4xl">
                    Stream
                  </h1>
                  <p className="tw-max-w-xl tw-mt-2 tw-text-lg tw-text-iron-400 tw-font-normal">
                    Engage with the community and get started by{" "}
                    <span className="tw-font-semibold tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-r tw-from-indigo-400 tw-to-indigo-500">
                      joining or creating a{" "}
                      <svg
                        className="tw-inline tw-h-6 tw-w-6 tw-text-indigo-300 tw-mr-1 tw-ml-1"
                        viewBox="0 0 48 48"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M46.5 40.5C46.5 41.328 45.828 42 45 42C43.083 42 41.835 42.624 40.392 43.347C38.844 44.1225 37.0905 45 34.5 45C31.896 45 30.135 44.1195 28.581 43.3425C27.141 42.6225 25.8975 42 24 42C22.1025 42 20.859 42.6225 19.419 43.3425C17.865 44.1195 16.104 45 13.5 45C10.9095 45 9.156 44.1225 7.608 43.347C6.165 42.624 4.917 42 3 42C2.172 42 1.5 41.328 1.5 40.5C1.5 39.672 2.172 39 3 39C5.6265 39 7.3935 39.885 8.952 40.665C10.383 41.3805 11.619 42 13.5 42C15.396 42 16.638 41.3775 18.078 40.659C19.632 39.8805 21.3945 39 24 39C26.6055 39 28.368 39.8805 29.922 40.659C31.362 41.3775 32.604 42 34.5 42C36.381 42 37.617 41.3805 39.048 40.665C40.6065 39.885 42.3735 39 45 39C45.828 39 46.5 39.672 46.5 40.5Z"
                          fill="currentColor"
                        />
                        <path
                          d="M46.5 33C46.5 33.828 45.828 34.5 45 34.5C43.083 34.5 41.835 35.124 40.392 35.847C38.844 36.6225 37.0905 37.5 34.5 37.5C31.896 37.5 30.135 36.6195 28.581 35.8425C27.141 35.1225 25.8975 34.5 24 34.5C22.1025 34.5 20.859 35.1225 19.419 35.8425C17.865 36.6195 16.104 37.5 13.5 37.5C10.9095 37.5 9.156 36.6225 7.608 35.847C6.165 35.124 4.917 34.5 3 34.5C2.172 34.5 1.5 33.828 1.5 33C1.5 32.172 2.172 31.5 3 31.5C5.6265 31.5 7.3935 32.385 8.952 33.165C10.383 33.8805 11.619 34.5 13.5 34.5C15.396 34.5 16.638 33.8775 18.078 33.159C19.632 32.3805 21.3945 31.5 24 31.5C26.6055 31.5 28.368 32.3805 29.922 33.159C31.362 33.8775 32.604 34.5 34.5 34.5C36.381 34.5 37.617 33.8805 39.048 33.165C40.6065 32.385 42.3735 31.5 45 31.5C45.828 31.5 46.5 32.172 46.5 33Z"
                          fill="currentColor"
                        />
                        <path
                          d="M1.5 25.5C1.5 24.672 2.172 24 3 24C8.382 24 10.41 20.1975 12.9765 15.3825C15.918 9.8655 19.578 3 30 3C35.13 3 39 6.2235 39 10.5C39 13.923 36.27 16.5 34.5 16.5C33.672 16.5 33 15.828 33 15C33 14.574 32.9025 13.971 32.058 13.656C30.936 13.239 29.352 13.617 28.6035 14.481C26.865 16.4895 26.526 19.8075 27.78 22.5495C29.067 25.3665 31.722 26.9835 35.064 26.9835C36.6945 26.9835 37.8405 26.388 39.1665 25.698C40.695 24.903 42.4305 24 45 24C45.828 24 46.5 24.672 46.5 25.5C46.5 26.328 45.828 27 45 27C43.1625 27 41.952 27.63 40.5495 28.359C39.0855 29.121 37.4265 29.9835 35.0625 29.9835C30.4965 29.9835 26.847 27.729 25.05 23.796C23.298 19.962 23.814 15.429 26.334 12.5175C27.9 10.71 30.813 9.9915 33.105 10.845C34.0665 11.2035 34.8225 11.808 35.3205 12.585C35.6865 12.0765 36 11.373 36 10.5C36 7.935 33.42 6 30 6C21.378 6 18.5835 11.2425 15.624 16.794C12.9495 21.8115 10.1835 27 3 27C2.172 27 1.5 26.328 1.5 25.5Z"
                          fill="currentColor"
                        />
                      </svg>
                      Wave!
                    </span>
                  </p>

                  <div className="tw-mt-8 tw-relative tw-text-base tw-text-iron-400 tw-font-normal">
                    <div className="tw-mt-6 tw-flex tw-items-center tw-gap-x-3">
                      <Link
                        href="/waves"
                        className="tw-no-underline tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-400 tw-bg-iron-950 tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-primary-400 hover:tw-text-primary-500 tw-group tw-shadow-sm  hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
                      >
                        <span>Explore Waves</span>
                        <svg
                          className="tw-size-5 tw-ml-1.5 -tw-mr-1 tw-flex-shrink-0 group-hover:tw-translate-x-1 tw-transition tw-duration-300 tw-ease-out"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          aria-hidden="true"
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
                      </Link>
                      <span className="tw-text-iron-500 tw-text-sm tw-font-normal">
                        or
                      </span>
                      <Link
                        type="button"
                        href="waves?new=true"
                        className="tw-no-underline tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white hover:tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="tw-relative tw-z-10 tw-block tw-float-none tw-text-4xl">
                  Stream
                </h1>
                <div className="tw-mt-6">
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
        <div className="md:tw-w-[26.5%] ">
          {!!items.length && (
            <div className="tw-mt-16">
              <Link
                href="/waves?new=true"
                className="tw-no-underline tw-w-full tw-justify-center tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
              </Link>
            </div>
          )}
          <StreamDiscovery />
        </div>
      </div>
    </div>
  );
}
