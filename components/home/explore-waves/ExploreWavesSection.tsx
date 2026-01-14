"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { ExploreWaveCard } from "./ExploreWaveCard";
import { ExploreWaveCardSkeleton } from "./ExploreWaveCardSkeleton";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const WAVES_LIMIT = 6;

export function ExploreWavesSection() {
  const {
    data: waves,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["explore-waves-homepage", WAVES_LIMIT],
    queryFn: async () => {
      return await commonApiFetch<ApiWave[]>({
        endpoint: "waves-overview",
        params: {
          type: "LATEST",
          limit: String(WAVES_LIMIT),
          offset: "0",
        },
      });
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
    <section className="-tw-mx-8 tw-py-16">
      <div className="tw-px-8">
        <div className="tw-mb-8 tw-flex tw-items-end tw-justify-between">
          <div>
            <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
              Explore waves
            </span>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-500">
              Browse channels—jump into the conversation.
            </p>
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

        {/* Grid */}
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 lg:tw-grid-cols-3 lg:tw-gap-5">
          {isLoading
            ? Array.from({ length: WAVES_LIMIT }).map((_, index) => (
                <ExploreWaveCardSkeleton key={`skeleton-${index}`} />
              ))
            : waves?.map((wave) => (
                <ExploreWaveCard key={wave.id} wave={wave} />
              ))}
        </div>
      </div>
    </section>
  );
}
