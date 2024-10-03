import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React, { useEffect, useState, useRef } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";
import Link from "next/link";
import { useIntersectionObserver } from "../../../hooks/useIntersectionObserver";
import { WaveDropsFeed } from "../../../generated/models/WaveDropsFeed";
import { useRouter } from "next/router";
import WaveDetailedFollowingWavesSort from "./WaveDetailedFollowingWavesSort";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import { getTimeAgoShort } from "../../../helpers/Helpers";

interface WaveDetailedFollowingWavesProps {
  readonly activeWaveId: string;
}

const PAGE_SIZE = 20;

const WaveDetailedFollowingWaves: React.FC<WaveDetailedFollowingWavesProps> = ({
  activeWaveId,
}) => {
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (data) {
      setWaves(getWaves());
    }
  }, [data]);

  const onHover = (waveId: string) => {
    queryClient.prefetchQuery({
      queryKey: [QueryKey.WAVE, { wave_id: waveId }],
      queryFn: async () =>
        await commonApiFetch<Wave>({
          endpoint: `waves/${waveId}`,
        }),
      staleTime: 60000,
    });
    queryClient.prefetchInfiniteQuery({
      queryKey: [
        QueryKey.DROPS,
        {
          waveId: waveId,
          limit: 50,
          dropId: null,
        },
      ],
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: "50",
        };

        if (pageParam) {
          params.serial_no_less_than = `${pageParam}`;
        }
        return await commonApiFetch<WaveDropsFeed>({
          endpoint: `waves/${waveId}/drops`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
      pages: 1,
      staleTime: 60000,
    });
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    waveId: string
  ) => {
    e.preventDefault();
    router.push(`/waves/${waveId}`, undefined, { shallow: true });
  };

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
              <div key={wave.id} className="tw-my-2">
                <Link
                  href={`/waves/${wave.id}`}
                  onClick={(e) => handleClick(e, wave.id)}
                  onMouseEnter={() => onHover(wave.id)}
                  className="tw-no-underline tw-flex tw-items-center tw-text-iron-200 tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group"
                >
                  <div className="tw-mr-3 tw-flex-shrink-0 tw-size-8 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-white/20 tw-bg-iron-900 tw-relative">
                    {wave.picture && (
                      <img
                        src={wave.picture}
                        alt={wave.name}
                        className="tw-w-full tw-h-full tw-rounded-full tw-object-contain"
                      />
                    )}
                    {wave.id !== activeWaveId && (
                      <div className="tw-absolute -tw-top-1 -tw-right-1 tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-xs tw-animate-pulse group-hover:tw-animate-bounce">
                        1
                      </div>
                    )}
                  </div>
                  <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
                    <span>{wave.name}</span>
                    <div className="tw-flex tw-items-center tw-pr-4 tw-text-xs tw-text-iron-400">
                      <span>
                        {getTimeAgoShort(wave.metrics.latest_drop_timestamp)}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
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
