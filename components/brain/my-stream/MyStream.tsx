import { useContext, useEffect, useState } from "react";
import { AuthContext, TitleType } from "../../auth/Auth";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { TypedFeedItem } from "../../../types/feed.types";
import { ProfileAvailableDropRateResponse } from "../../../entities/IProfile";
import FeedWrapper from "../feed/FeedWrapper";
import CircleLoader, { CircleLoaderSize } from "../../distribution-plan-tool/common/CircleLoader";

export default function MyStream() {
  const { connectedProfile, activeProfileProxy, setTitle } =
    useContext(AuthContext);
  const [isInitialQueryDone, setIsInitialQueryDone] = useState(false);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
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

  useEffect(() => {
    setItems(data?.pages.flat() ?? []);
    setIsInitialQueryDone(true);
  }, [data]);

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

  const [haveNewItems, setHaveNewItems] = useState(false);

  const { data: pollingResult } = useQuery({
    queryKey: [QueryKey.FEED_ITEMS, { limit: 1 }],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
      };
      return await commonApiFetch<TypedFeedItem[]>({
        endpoint: `feed/`,
        params,
      });
    },
    enabled: !haveNewItems && isInitialQueryDone,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    // Check if items have been fetched at least once
    if (data !== undefined && pollingResult !== undefined) {
      // Check if we have polling results
      if (pollingResult.length > 0) {
        const latestPolledItem = pollingResult[0];

        // If there are existing items, compare with the latest one
        if (items.length > 0) {
          const latestExistingItem = items[0];

          // Convert creation times to milliseconds for comparison
          const polledSerialNo = latestPolledItem.serial_no;
          const existingSerialNo = latestExistingItem.serial_no;

          // Set haveNewItems to true if polled item is newer, false otherwise
          setHaveNewItems(polledSerialNo > existingSerialNo);
        } else {
          // If no existing items but polling found one, set haveNewItems to true
          setHaveNewItems(true);
        }
      } else {
        // If no polling results, assume no new items
        setHaveNewItems(false);
      }
    }
    // If items haven't been fetched yet, don't update haveNewItems
  }, [pollingResult, items, data]);

  const onRefresh = () => {
    refetch();
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

  useEffect(() => {
    // Set the title when the component mounts or when haveNewItems changes
    setTitle({
      title: haveNewItems ? "New Stream Items Available | 6529 SEIZE" : null,
      type: TitleType.MY_STREAM,
    });

    // Cleanup function to reset the title when the component unmounts
    return () => {
      setTitle({
        title: null,
        type: TitleType.MY_STREAM,
      });
    };
  }, [haveNewItems]);

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
        {haveNewItems && (
          <div className="tw-sticky tw-top-4 tw-left-0 -tw-mb-8 tw-right-0 tw-z-50 tw-flex tw-justify-center">
            <button
              onClick={onRefresh}
              type="button"
              className="tw-border-none tw-bg-primary-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-md tw-cursor-pointer tw-transition-all tw-flex tw-items-center tw-gap-2 hover:tw-bg-primary-600 tw-text-xs tw-font-medium"
            >
              New items available {isFetching && <CircleLoader size={CircleLoaderSize.SMALL}/>}
            </button>
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
  );
}
