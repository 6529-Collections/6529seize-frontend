"use client";

import { useAuth } from "@/components/auth/Auth";
import { WAVE_SCORE_DISCOVERY_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import type { ApiWaveVisibilityTier } from "@/generated/models/ApiWaveVisibilityTier";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  ApiWavesOverviewType,
  type ApiWavesOverviewType as ApiWavesOverviewTypeValue,
} from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { ExploreWaveCard } from "./ExploreWaveCard";
import { ExploreWaveCardSkeleton } from "./ExploreWaveCardSkeleton";
import {
  HOME_ACTION_ARROW_CLASSES,
  HOME_VIEW_ALL_CLASSES,
  HOME_TEXT_LINK_CLASSES,
  HOME_SECTION_TITLE_CLASSES,
} from "../homeInteractionStyles";

const DEFAULT_WAVES_LIMIT = 6;

interface ExploreWavesSectionProps {
  readonly headingVariant?: "default" | "page" | undefined;
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
  readonly headerActions?: ReactNode | undefined;
  readonly showEmptyState?: boolean | undefined;
  readonly emptyStateLabel?: string | undefined;
}

export function ExploreWavesSection({
  headingVariant = "default",
  title,
  subtitle,
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
  statusLabel,
  headerControls,
  headerActions,
  showEmptyState = false,
  emptyStateLabel,
}: ExploreWavesSectionProps) {
  const locale = useBrowserLocale();
  const effectiveTitle = title ?? t(locale, "home.exploreWaves.heading.title");
  const defaultSubtitleKey =
    headingVariant === "default"
      ? "home.exploreWaves.gallery.subtitle"
      : "home.exploreWaves.heading.subtitle";
  const effectiveSubtitle =
    subtitle === undefined ? t(locale, defaultSubtitleKey) : subtitle;
  const effectiveStatusLabel =
    statusLabel ?? t(locale, "home.exploreWaves.status.defaultLabel");
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

  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    data: waves,
    isLoading,
    isError,
    isFetching,
    refetch,
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

  // A failed refetch keeps the waves already loaded on screen; only a failure
  // with nothing to show becomes an error state.
  const hasLoadError = isError && (waves?.length ?? 0) === 0;

  if (hasLoadError && !showEmptyState) {
    return null;
  }

  const hasNoWaves =
    !isLoading && !hasLoadError && (!waves || waves.length === 0);

  if (hasNoWaves && !showEmptyState) {
    return null;
  }

  const resultStatus = isLoading
    ? t(locale, "home.exploreWaves.status.loading", {
        label: effectiveStatusLabel,
      })
    : hasNoWaves
      ? (emptyStateLabel ??
        t(locale, "home.exploreWaves.status.empty", {
          label: effectiveStatusLabel,
        }))
      : t(locale, "home.exploreWaves.status.showing", {
          count: waves?.length ?? 0,
          label: effectiveStatusLabel,
        });
  const hasHeaderAdditions = Boolean(headerControls);
  const headerSpacingClassName =
    headingVariant === "page" ? "tw-mb-10 md:tw-mb-12" : "tw-mb-7 md:tw-mb-8";
  const headerLayout =
    headingVariant === "page"
      ? "tw-block md:tw-gap-4"
      : "tw-flex tw-flex-col tw-items-start tw-gap-3 md:tw-gap-6";
  const headerClassName = hasHeaderAdditions
    ? "tw-mb-5 tw-flex tw-flex-col tw-items-start tw-gap-4 md:tw-mb-8"
    : `tw-relative ${headerSpacingClassName} ${headerLayout} md:tw-flex md:tw-flex-row md:tw-items-end md:tw-justify-between`;
  const titleClassName =
    headingVariant === "page"
      ? "tw-w-full tw-min-w-0 tw-text-left"
      : "tw-min-w-0 tw-text-left";

  let content: ReactNode;
  if (hasLoadError) {
    content = (
      <div
        role="alert"
        className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-8 tw-text-center"
      >
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300">
          {t(locale, "home.exploreWaves.error.message", {
            label: effectiveStatusLabel,
          })}
        </p>
        <Button
          variant="secondary"
          loading={isFetching}
          onClick={() => {
            resultsRef.current?.focus({ preventScroll: true });
            void refetch();
          }}
        >
          {t(locale, "home.exploreWaves.error.retry")}
        </Button>
      </div>
    );
  } else if (hasNoWaves) {
    content = (
      <div
        role="status"
        className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-8 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400"
      >
        {emptyStateLabel ??
          t(locale, "home.exploreWaves.status.empty", {
            label: effectiveStatusLabel,
          })}
      </div>
    );
  } else {
    content = (
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-3 tw-gap-y-4 sm:tw-grid-cols-2 sm:tw-gap-6 lg:tw-grid-cols-3">
        {isLoading
          ? Array.from({ length: limit }).map((_, index) => (
              <div key={`skeleton-${index}`} className="tw-h-full tw-w-full">
                <ExploreWaveCardSkeleton
                  horizontalOnMobile={headingVariant === "default"}
                  artworkOverlay={headingVariant === "page"}
                />
              </div>
            ))
          : waves?.map((wave) => (
              <div key={wave.id} className="tw-h-full tw-w-full">
                <ExploreWaveCard
                  wave={wave}
                  horizontalOnMobile={headingVariant === "default"}
                  artworkOverlay={headingVariant === "page"}
                  subtleHover
                />
              </div>
            ))}
      </div>
    );
  }

  return (
    <section
      data-home-section={
        !isLoading && !hasNoWaves && !hasLoadError ? "Explore waves" : undefined
      }
      className={
        headingVariant === "page"
          ? "tw-px-4 tw-pb-10 tw-pt-4 md:tw-px-6 md:tw-pb-16 lg:tw-px-8"
          : "tw-px-4 tw-pb-20 tw-pt-20 md:tw-px-6 md:tw-pb-32 md:tw-pt-32 lg:tw-px-8"
      }
    >
      <div
        className={
          headingVariant === "default"
            ? "tw-mx-auto tw-max-w-[1200px]"
            : undefined
        }
      >
        <div className={headerClassName}>
          <div className={titleClassName}>
            {headingVariant === "page" ? (
              <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 tw-@container/discovery-heading">
                <h1 className="tw-m-0 tw-min-w-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-text-white">
                  {effectiveTitle}
                </h1>
                {headerActions}
              </div>
            ) : (
              <h2 className={HOME_SECTION_TITLE_CLASSES}>{effectiveTitle}</h2>
            )}
            {effectiveSubtitle && (
              <p
                className={
                  headingVariant === "page"
                    ? "tw-mb-0 tw-mt-2 tw-text-base tw-text-iron-500"
                    : "tw-mb-0 tw-mt-3 tw-max-w-[640px] tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-400 md:tw-text-[15px]"
                }
              >
                {effectiveSubtitle}
              </p>
            )}
          </div>
          {viewAllHref && (
            <Link
              data-home-action="View all"
              href={viewAllHref}
              className={
                headingVariant === "default"
                  ? HOME_TEXT_LINK_CLASSES
                  : `${HOME_VIEW_ALL_CLASSES} tw-absolute tw-right-0 tw-top-0 tw-inline-flex md:tw-static`
              }
            >
              <span>{t(locale, "home.exploreWaves.viewAll")}</span>
              <ArrowRightIcon
                className={HOME_ACTION_ARROW_CLASSES}
                aria-hidden
              />
            </Link>
          )}
          {headerControls}
        </div>
        {!hasLoadError && (
          <p role="status" className="tw-sr-only">
            {resultStatus}
          </p>
        )}

        <div ref={resultsRef} tabIndex={-1} className="focus:tw-outline-none">
          {content}
        </div>
      </div>
    </section>
  );
}
