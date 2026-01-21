"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExploreWaveCard } from "./ExploreWaveCard";
import { ExploreWaveCardSkeleton } from "./ExploreWaveCardSkeleton";

const WAVES_LIMIT = 6;

export function ExploreWavesSection() {
  const {
    data: waves,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["explore-waves-homepage", WAVES_LIMIT],
    queryFn: async () => {
      const data = await commonApiFetch<ApiWave[]>({
        endpoint: "waves-overview/hot",
      });
      return data.slice(0, WAVES_LIMIT);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Hide section on error or if no waves
  if (isError) {
    return null;
  }

  if (!isLoading && (!waves || waves.length === 0)) {
    return null;
  }

  return (
    <section className="-tw-mx-8 tw-py-10 tw-pl-4 tw-pr-0 md:tw-px-6 md:tw-py-16 lg:tw-px-8">
      <div className="tw-px-8">
        <div className="tw-mb-8 tw-flex tw-flex-col tw-items-start tw-gap-4 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
          <div>
            <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
              Tired of bot replies?
            </span>
          </div>
          <Link
            href="/waves"
            className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-white"
          >
            <span>View all</span>
            <ArrowRightIcon
              className="tw-size-4 tw-flex-shrink-0"
              aria-hidden
            />
          </Link>
        </div>

        <div className="-tw-mx-6 tw-flex tw-gap-4 tw-overflow-x-auto tw-scroll-smooth tw-px-6 tw-pb-2 tw-scrollbar-none md:-tw-mx-8 md:tw-px-8 lg:tw-grid lg:tw-grid-cols-3 lg:tw-gap-5 lg:tw-overflow-visible lg:tw-pb-0">
          {isLoading
            ? Array.from({ length: WAVES_LIMIT }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="tw-w-[80%] tw-shrink-0 sm:tw-w-80 lg:tw-w-full"
                >
                  <ExploreWaveCardSkeleton />
                </div>
              ))
            : waves?.map((wave) => (
                <div
                  key={wave.id}
                  className="tw-w-[80%] tw-shrink-0 sm:tw-w-80 lg:tw-w-full"
                >
                  <ExploreWaveCard wave={wave} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
