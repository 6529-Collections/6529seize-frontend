"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExploreWaveCard } from "./ExploreWaveCard";
import { ExploreWaveCardSkeleton } from "./ExploreWaveCardSkeleton";

const DEFAULT_WAVES_LIMIT = 6;

interface ExploreWavesSectionProps {
  readonly title?: string | undefined;
  readonly subtitle?: string | null | undefined;
  readonly limit?: number | undefined;
  readonly endpoint?: string | undefined;
  readonly viewAllHref?: string | null | undefined;
  readonly excludeFollowed?: boolean | undefined;
}

export function ExploreWavesSection({
  title = "Tired of bot replies? Join the most interesting chats in crypto",
  subtitle = "Most active waves",
  limit = DEFAULT_WAVES_LIMIT,
  endpoint = "waves-overview/hot",
  viewAllHref = "/waves",
  excludeFollowed = false,
}: ExploreWavesSectionProps) {
  const { connectedProfile } = useAuth();
  const userScope =
    connectedProfile?.id ??
    connectedProfile?.normalised_handle ??
    connectedProfile?.handle ??
    null;

  const {
    data: waves,
    isLoading,
    isError,
  } = useQuery<ApiWave[]>({
    queryKey: [
      "explore-waves",
      endpoint,
      limit,
      excludeFollowed,
      excludeFollowed ? userScope : null,
    ],
    queryFn: async () => {
      const data = await commonApiFetch<ApiWave[]>({
        endpoint,
        params: excludeFollowed ? { exclude_followed: "true" } : undefined,
      });
      return data.slice(0, limit);
    },
    staleTime: excludeFollowed ? 0 : 5 * 60 * 1000,
    ...(excludeFollowed ? { gcTime: 0 } : {}),
  });

  if (isError) {
    return null;
  }

  if (!isLoading && (!waves || waves.length === 0)) {
    return null;
  }

  return (
    <section className="tw-px-4 tw-py-10 md:tw-px-6 md:tw-py-16 lg:tw-px-8">
      <div>
        <div className="tw-mb-8 tw-flex tw-flex-col tw-items-start tw-gap-4 md:tw-items-end">
          <div className="tw-max-w-sm md:tw-mx-auto md:tw-max-w-xl md:tw-text-center lg:tw-max-w-full">
            <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-200 md:tw-text-2xl">
              {title}
            </span>
            {subtitle && (
              <p className="tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 tw-gap-x-3 tw-gap-y-4 sm:tw-grid-cols-2 sm:tw-gap-6 lg:tw-grid-cols-3">
          {isLoading
            ? Array.from({ length: limit }).map((_, index) => (
                <div key={`skeleton-${index}`} className="tw-w-full">
                  <ExploreWaveCardSkeleton />
                </div>
              ))
            : waves?.map((wave) => (
                <div key={wave.id} className="tw-w-full">
                  <ExploreWaveCard wave={wave} />
                </div>
              ))}
        </div>

        {viewAllHref && (
          <div className="tw-mt-8 tw-flex tw-justify-center md:tw-mt-10">
            <Link
              href={viewAllHref}
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-white"
            >
              <span>View all</span>
              <ArrowRightIcon
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
