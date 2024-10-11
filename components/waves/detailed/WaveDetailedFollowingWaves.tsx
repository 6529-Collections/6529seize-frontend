import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";
import { useIntersectionObserver } from "../../../hooks/useIntersectionObserver";
import WaveDetailedFollowingWavesSort from "./WaveDetailedFollowingWavesSort";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import { useNewDropsCount } from "../../../hooks/useNewDropsCount";
import WaveDetailedFollowingWave from "./WaveDetailedFollowingWave";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "../../react-query-wrapper/utils/query-utils";
import { WaveDetailedMobileView } from "./WaveDetailedMobile";

interface WaveDetailedFollowingWavesProps {
  readonly activeWaveId: string;
  readonly onWaveChange: (wave: Wave) => void;
  readonly setActiveView: (view: WaveDetailedMobileView) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}

const WaveDetailedFollowingWaves: React.FC<WaveDetailedFollowingWavesProps> = ({
  activeWaveId,
  onWaveChange,
  setActiveView,
  setIsLoading,
}) => {
  const [selectedSort, setSelectedSort] = useState<WavesOverviewType>(
    WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType
  );

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        QueryKey.WAVES_OVERVIEW,
        {
          limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
          type: selectedSort,
          only_waves_followed_by_authenticated_user:
            WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
        },
      ],
      queryFn: async ({ pageParam }: { pageParam: number }) => {
        const queryParams: Record<string, string> = {
          limit: `${WAVE_FOLLOWING_WAVES_PARAMS.limit}`,
          offset: `${pageParam}`,
          type: selectedSort,
          only_waves_followed_by_authenticated_user:
            WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user.toString(),
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
  const memoizedWaves = useMemo(() => waves || [], [waves]);

  const handleWaveChange = (wave: Wave) => {
    setIsLoading(true);
    onWaveChange(wave);
    setActiveView(WaveDetailedMobileView.CHAT);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="tw-mt-4 tw-mb-3">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-5">
        <div className="tw-flex tw-flex-col tw-gap-y-1 tw-px-5">
          <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-200 tw-tracking-tight">
            Waves you follow
          </p>
          <WaveDetailedFollowingWavesSort
            selectedOption={selectedSort}
            setSelectedOption={setSelectedSort}
          />
        </div>
        <div className="tw-mt-2 tw-max-h-60 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-iron-900">
          <div className="tw-flex tw-flex-col">
            {memoizedWaves.map((wave) => (
              <WaveDetailedFollowingWave
                key={wave.id}
                wave={wave}
                activeWaveId={activeWaveId}
                newDropsCounts={newDropsCounts}
                resetWaveCount={resetWaveCount}
                onWaveChange={() => handleWaveChange(wave)}
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
