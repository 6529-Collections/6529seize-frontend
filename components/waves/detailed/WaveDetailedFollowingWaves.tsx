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

const PAGE_SIZE = 20;

const WaveDetailedFollowingWaves: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const queryKey = [
    QueryKey.DROPS,
    {
      page_size: PAGE_SIZE,
      target_type: "WAVE",
    },
  ];

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          page_size: PAGE_SIZE.toString(),
        };

        if (pageParam) {
          params.page = `${pageParam}`;
        }
        return await commonApiFetch<{
          data: { target: Wave }[];
          count: number;
          page: number;
          next: boolean;
        }>({
          endpoint: `/identity-subscriptions/outgoing/WAVE`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.next ? lastPage.page + 1 : null,
      placeholderData: keepPreviousData,
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
    return data.pages.flatMap((wave) => wave.data.map((wave) => wave.target));
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
              Waves you follow
            </p>
          </div>
          <WaveDetailedFollowingWavesSort />
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
                    <div className="tw-absolute -tw-top-1 -tw-right-1 tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-xs tw-animate-pulse group-hover:tw-animate-bounce">
                      1
                    </div>
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <span>{wave.name}</span>
                    <div className="tw-flex tw-items-center tw-gap-x-1 tw-text-xs tw-text-iron-400">
                      <svg
                        className="tw-size-4 tw-flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                        />
                      </svg>
                      <span>75</span>
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
