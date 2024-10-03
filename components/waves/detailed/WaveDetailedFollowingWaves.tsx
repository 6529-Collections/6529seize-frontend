import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";
import { useIntersectionObserver } from "../../../hooks/useIntersectionObserver";
import { useRouter } from "next/router";
import WaveDetailedFollowingWavesSort from "./WaveDetailedFollowingWavesSort";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import { useNewDropsCount } from "../../../hooks/useNewDropsCount";
import WaveDetailedFollowingWave from "./WaveDetailedFollowingWave";

interface WaveDetailedFollowingWavesProps {
  readonly activeWaveId: string;
}

const PAGE_SIZE = 20;

const WaveDetailedFollowingWaves: React.FC<WaveDetailedFollowingWavesProps> = ({
  activeWaveId,
}) => {
  const router = useRouter();

  const [selectedSort, setSelectedSort] = useState<WavesOverviewType>(
    WavesOverviewType.RecentlyDroppedTo
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.WAVES_OVERVIEW,
      {
        limit: PAGE_SIZE,
        type: selectedSort,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${PAGE_SIZE}`,
        offset: `${pageParam}`,
        type: selectedSort,
        only_waves_followed_by_authenticated_user: "true",
      };
      return await commonApiFetch<Wave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages, lastPageParam) => {
      const nextOffset = allPages.flat().length;
      if (nextOffset === lastPageParam) {
        return null;
      }
      return nextOffset;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
  });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  const getWaves = () => {
    if (!data?.pages.length) {
      return [];
    }
    return data.pages.flatMap((page) => page);
  };

  const [waves, setWaves] = useState<Wave[]>(getWaves());
  const { newDropsCounts, resetWaveCount } = useNewDropsCount(
    waves,
    activeWaveId
  );

  useEffect(() => {
    if (data) {
      setWaves(getWaves());
    }
  }, [data]);

  return (
    <div className="tw-mt-4 tw-mb-3">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-5 tw-px-5">
        <div className="tw-h-8 tw-flex tw-items-center tw-gap-x-2 tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-x-3">
            <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200 tw-tracking-tight">
              Following
            </p>
          </div>
          <WaveDetailedFollowingWavesSort
            selectedOption={selectedSort}
            setSelectedOption={setSelectedSort}
          />
        </div>
        <div className="tw-mt-2 tw-max-h-60 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-iron-900">
          <div className="tw-flex tw-flex-col">
            {waves.map((wave) => (
              <WaveDetailedFollowingWave
                key={wave.id}
                wave={wave}
                activeWaveId={activeWaveId}
                newDropsCounts={newDropsCounts}
                resetWaveCount={resetWaveCount}
              />
            ))}
            {isFetchingNextPage && (
              <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
                <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
              </div>
            )}
            <div ref={intersectionElementRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveDetailedFollowingWaves;
