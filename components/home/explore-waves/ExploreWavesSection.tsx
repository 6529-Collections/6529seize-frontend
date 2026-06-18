"use client";

import { useAuth } from "@/components/auth/Auth";
import { WAVE_SCORE_DISCOVERY_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import type { ApiWaveVisibilityTier } from "@/generated/models/ApiWaveVisibilityTier";
import {
  ApiWavesOverviewType,
  type ApiWavesOverviewType as ApiWavesOverviewTypeValue,
} from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExploreWaveCard } from "./ExploreWaveCard";
import { ExploreWaveCardSkeleton } from "./ExploreWaveCardSkeleton";

const DEFAULT_WAVES_LIMIT = 6;

interface ExploreWavesSectionProps {
  readonly title?: string | undefined;
  readonly subtitle?: string | null | undefined;
  readonly limit?: number | undefined;
  readonly viewAllHref?: string | null | undefined;
  readonly excludeFollowed?: boolean | undefined;
  readonly view?: ApiWavesV2ListType | undefined;
  readonly overviewType?: ApiWavesOverviewTypeValue | undefined;
  readonly directMessage?: boolean | undefined;
  readonly scoreSort?: ApiWaveScoreSort | undefined;
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
  readonly visibilityTier?: ApiWaveVisibilityTier | undefined;
  readonly statusLabel?: string | undefined;
  readonly headerControls?: ReactNode | undefined;
  readonly showEmptyState?: boolean | undefined;
  readonly emptyStateLabel?: string | undefined;
}

export function ExploreWavesSection({
  title = "Tired of bot replies? Join the most interesting chats in crypto",
  subtitle = "Most active waves",
  limit = DEFAULT_WAVES_LIMIT,
  viewAllHref = "/waves",
  excludeFollowed = false,
  view = ApiWavesV2ListType.Overview,
  overviewType = WAVE_SCORE_DISCOVERY_PARAMS.overviewType,
  directMessage,
  scoreSort,
  minVisibilityScore,
  minQualityScore,
  minHotnessScore,
  minRepSortScore,
  visibilityTier,
  statusLabel = "waves",
  headerControls,
  showEmptyState = false,
  emptyStateLabel,
}: ExploreWavesSectionProps) {
  const { connectedProfile } = useAuth();
  const userScope =
    connectedProfile?.id ??
    connectedProfile?.normalised_handle ??
    connectedProfile?.handle ??
    null;
  const effectiveExcludeFollowed = excludeFollowed && userScope !== null;
  const shouldDefaultScoreSort =
    view === ApiWavesV2ListType.Overview &&
    overviewType === ApiWavesOverviewType.ScoredRecentlyDroppedTo;
  const effectiveScoreSort =
    scoreSort ??
    (shouldDefaultScoreSort
      ? WAVE_SCORE_DISCOVERY_PARAMS.scoreSort
      : undefined);
  const shouldServerExcludeFollowed =
    effectiveExcludeFollowed && view !== ApiWavesV2ListType.Search;

  const {
    data: waves,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "explore-waves",
      view,
      overviewType,
      directMessage,
      effectiveScoreSort,
      minVisibilityScore,
      minQualityScore,
      minHotnessScore,
      minRepSortScore,
      visibilityTier,
      limit,
      effectiveExcludeFollowed,
      userScope,
    ],
    queryFn: async () => {
      const page = await fetchWavesV2Page({
        view,
        overviewType,
        page: 1,
        pageSize: limit,
        directMessage,
        excludeFollowed: shouldServerExcludeFollowed ? true : undefined,
        scoreSort: effectiveScoreSort,
        minVisibilityScore,
        minQualityScore,
        minHotnessScore,
        minRepSortScore,
        visibilityTier,
      });
      return page.waves;
    },
    staleTime: effectiveExcludeFollowed ? 0 : 5 * 60 * 1000,
    ...(effectiveExcludeFollowed ? { gcTime: 0 } : {}),
  });

  if (isError) {
    return null;
  }

  const hasNoWaves = !isLoading && (!waves || waves.length === 0);

  if (hasNoWaves && !showEmptyState) {
    return null;
  }

  const resultStatus = isLoading
    ? `Loading ${statusLabel}`
    : hasNoWaves
      ? (emptyStateLabel ?? `No ${statusLabel}`)
      : `Showing ${waves?.length ?? 0} ${statusLabel}`;

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
          {headerControls}
        </div>
        <p role="status" className="tw-sr-only">
          {resultStatus}
        </p>

        {hasNoWaves ? (
          <div
            role="status"
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-8 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400"
          >
            {emptyStateLabel ?? `No ${statusLabel}`}
          </div>
        ) : (
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
        )}

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
