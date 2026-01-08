"use client";

import { useContext, useEffect, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import WaveItem from "./WaveItem";
import { AuthContext } from "@/components/auth/Auth";
import type { WavesOverviewParams } from "@/types/waves.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const LABELS: Record<ApiWavesOverviewType, string> = {
  [ApiWavesOverviewType.Latest]: "Latest",
  [ApiWavesOverviewType.MostSubscribed]: "Most Followed",
  [ApiWavesOverviewType.HighLevelAuthor]: "High Level Authors",
  [ApiWavesOverviewType.AuthorYouHaveRepped]:
    "Waves from Authors You Have Repped",
  [ApiWavesOverviewType.MostDropped]: "Most Dropped",
  [ApiWavesOverviewType.MostDroppedByYou]: "Most Dropped by You",
  [ApiWavesOverviewType.RecentlyDroppedTo]: "Recently Dropped",
  [ApiWavesOverviewType.RecentlyDroppedToByYou]: "Recently Dropped by You",
};

const SHOW_ALL_REQUEST_SIZE = 12;
const NORMAL_REQUEST_SIZE = 3;

export default function WavesListWrapper({
  overviewType,
  showAllType,
  setShowAllType,
}: {
  readonly overviewType: ApiWavesOverviewType;
  readonly showAllType: ApiWavesOverviewType | null;
  readonly setShowAllType: (type: ApiWavesOverviewType | null) => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isShowAll = showAllType === overviewType;

  const getUsePublicWaves = () =>
    !connectedProfile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());

  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): Omit<WavesOverviewParams, "offset"> => {
    return {
      limit: isShowAll ? SHOW_ALL_REQUEST_SIZE : NORMAL_REQUEST_SIZE,
      type: overviewType,
    };
  };

  const [params, setParams] = useState<Omit<WavesOverviewParams, "offset">>(
    getParams()
  );
  useEffect(() => setParams(getParams()), [overviewType, isShowAll]);

  const {
    data: wavesAuth,
    fetchNextPage: fetchNextPageAuth,
    hasNextPage: hasNextPageAuth,
    isFetching: isFetchingAuth,
    isFetchingNextPage: isFetchingNextPageAuth,
    status: statusAuth,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
      };
      return await commonApiFetch<ApiWave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) => allPages.flat().length,
    enabled: !usePublicWaves,
  });

  const {
    data: wavesPublic,
    fetchNextPage: fetchNextPagePublic,
    hasNextPage: hasNextPagePublic,
    isFetching: isFetchingPublic,
    isFetchingNextPage: isFetchingNextPagePublic,
    status: statusPublic,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW_PUBLIC, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
      };
      return await commonApiFetch<ApiWave[]>({
        endpoint: `public/waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) => allPages.flat().length,
    enabled: usePublicWaves,
  });

  const getWaves = (): ApiWave[] => {
    if (usePublicWaves) {
      return wavesPublic?.pages.flat() ?? [];
    }
    return wavesAuth?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<ApiWave[]>(getWaves());
  useEffect(
    () => setWaves(getWaves()),
    [wavesAuth, wavesPublic, usePublicWaves]
  );

  const onShowAll = () => {
    if (showAllType === overviewType) {
      setShowAllType(null);
      return;
    }
    setShowAllType(overviewType);
  };

  const onBottomIntersection = (state: boolean) => {
    if (waves.length < SHOW_ALL_REQUEST_SIZE) {
      return;
    }
    if (!state) {
      return;
    }
    if (usePublicWaves) {
      if (statusPublic === "pending") {
        return;
      }
      if (isFetchingPublic) {
        return;
      }
      if (isFetchingNextPagePublic) {
        return;
      }
      if (!hasNextPagePublic) {
        return;
      }
      fetchNextPagePublic();
      return;
    }
    if (statusAuth === "pending") {
      return;
    }
    if (isFetchingAuth) {
      return;
    }
    if (isFetchingNextPageAuth) {
      return;
    }
    if (!hasNextPageAuth) {
      return;
    }
    fetchNextPageAuth();
  };

  if (!waves.length) {
    return null;
  }

  return (
    <div>
      <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between">
        <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
          {LABELS[overviewType]}
        </span>
        {waves.length >= NORMAL_REQUEST_SIZE && (
          <button
            onClick={onShowAll}
            className={`tw-group tw-whitespace-nowrap tw-bg-transparent tw-border-none tw-text-iron-400 hover:tw-text-iron-50 tw-text-sm tw-font-semibold tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center ${
              !isShowAll ? "hover:tw-translate-x-[-8px] -tw-mr-4" : ""
            }`}>
            <span
              className={`${
                !isShowAll
                  ? "group-hover:tw-translate-x-[-4px] tw-transition-transform tw-duration-300 tw-ease-out"
                  : ""
              }`}>
              {isShowAll ? "Show less" : "Show all"}
            </span>
            {!isShowAll && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="tw-w-4 tw-h-4 tw-ml-1 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300 tw-ease-out">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="tw-overflow-hidden">
        <div className="tw-mt-3 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 lg:tw-gap-5">
          {waves.map((wave) => (
            <WaveItem key={`${overviewType}-${wave.id}`} wave={wave} />
          ))}
        </div>
        {isShowAll && (
          <>
            {(isFetchingAuth || isFetchingPublic) && (
              <div className="tw-w-full tw-text-center tw-mt-8">
                <CircleLoader size={CircleLoaderSize.XXLARGE} />
              </div>
            )}
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          </>
        )}
      </div>
    </div>
  );
}
