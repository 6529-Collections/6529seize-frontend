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
import { AnimatePresence, motion } from "framer-motion";

const PAGE_SIZE = 20;

const WaveDetailedFollowingWaves: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption === option) {
      setSelectedOption(null);
      setIsDropdownOpen(false);
    } else {
      setSelectedOption(option);
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (data) {
      setWaves(getWaves());
    }
  }, [data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          <div className="tw-relative" ref={dropdownRef}>
            <div className="tw-group">
              <button
                type="button"
                onClick={toggleDropdown}
                className="tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-justify-between tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400 hover:tw-text-primary-400 tw-bg-iron-950 tw-rounded-lg focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-border-primary-400 tw-transition-colors tw-duration-300 tw-ease-out tw-px-2 tw-py-2 -tw-mr-2"
              >
                <span>{selectedOption || "Sort by"}</span>
                <svg
                  className="tw-size-4 tw-flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="tw-absolute tw-z-10 tw-w-56 tw-right-0 tw-bottom-full tw-mb-1 tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-lg tw-shadow-lg tw-shadow-iron-950/50"
                  >
                    <div className="tw-py-2 tw-px-2 tw-space-y-1.5">
                      {[
                        "Latest Drops",
                        "Most Subscribed",
                        "Most Dropped",
                        "Most Dropped by You",
                        "Recently Dropped",
                        "Recently Dropped by You",
                      ].map((option) => (
                        <div
                          key={option}
                          onClick={() => handleOptionSelect(option)}
                          className={`tw-px-4 tw-py-2 tw-text-xs tw-rounded-xl tw-transition-colors tw-duration-300 tw-cursor-pointer tw-whitespace-nowrap tw-flex tw-justify-between tw-items-center ${
                            selectedOption === option
                              ? "tw-text-iron-100 tw-bg-iron-700"
                              : "tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-100"
                          }`}
                        >
                          {option}
                          {selectedOption === option && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              aria-hidden="true"
                              stroke="currentColor"
                              className="tw-w-4 tw-h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
