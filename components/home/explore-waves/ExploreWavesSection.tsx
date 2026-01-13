"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
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
    <section className="tw-py-16 tw-border-t tw-border-iron-900 tw-border-solid tw-border-x-0 tw-border-b-0 -tw-mx-8">
      <div className="tw-px-8">
        <div className="tw-mb-10 tw-flex tw-flex-col tw-items-center tw-gap-2">
          <span className="tw-text-3xl tw-text-center tw-font-bold tw-text-white/95">
            Explore waves
          </span>
          <p className="tw-text-sm tw-text-center tw-text-iron-600">
            Browse channels—jump into the conversation.
          </p>
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
