"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
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
    <section className="tw-py-8">
      {/* Header */}
      <div className="tw-mb-6 tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            Explore waves
          </h2>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            Browse channels—jump into the conversation.
          </p>
        </div>
        <Link
          href="/discover"
          className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-iron-50"
        >
          View all
        </Link>
      </div>

      {/* Grid */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 lg:tw-grid-cols-3 lg:tw-gap-5">
        {isLoading
          ? Array.from({ length: WAVES_LIMIT }).map((_, index) => (
              <ExploreWaveCardSkeleton key={`skeleton-${index}`} />
            ))
          : waves?.map((wave) => <ExploreWaveCard key={wave.id} wave={wave} />)}
      </div>
    </section>
  );
}
