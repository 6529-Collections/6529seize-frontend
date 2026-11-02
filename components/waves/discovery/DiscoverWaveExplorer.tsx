"use client";
import { ActiveWaveVotes } from "./ActiveWaveVotes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveDiscoveryViewer } from "@/hooks/useWaveDiscoveryViewer";
import { t } from "@/i18n/messages";

import { WAVE_SCORE_DISCOVERY_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useId, useMemo, useRef } from "react";
import {
  DiscoverWaveControls,
  ScoreFormulaLink,
  SORT_OPTIONS,
  type DiscoverScoreFilter,
  type DiscoverSort,
} from "./DiscoverWaveControls";

interface DiscoverFilterScores {
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
}

const SORT_PARAM = "sort";
const FILTER_PARAM = "filter";

const parseSort = (value: string | null): DiscoverSort => {
  switch (value) {
    case ApiWaveScoreSort.Balanced:
    case ApiWaveScoreSort.Quality:
    case ApiWaveScoreSort.Hotness:
    case ApiWaveScoreSort.Rep:
    case "NEWEST":
    case "LATEST_POSTS":
      return value;
    default:
      return WAVE_SCORE_DISCOVERY_PARAMS.scoreSort;
  }
};

const parseFilter = (value: string | null): DiscoverScoreFilter => {
  switch (value) {
    case "SCORE_50":
    case "HOT_60":
    case "REP_60":
      return value;
    default:
      return "ALL";
  }
};

const getFilterScores = (filter: DiscoverScoreFilter): DiscoverFilterScores => {
  switch (filter) {
    case "SCORE_50":
      return { minVisibilityScore: 50 };
    case "HOT_60":
      return { minHotnessScore: 60 };
    case "REP_60":
      return { minRepSortScore: 60 };
    case "ALL":
    default:
      return {};
  }
};

const isScoreSort = (sort: DiscoverSort): sort is ApiWaveScoreSort => {
  switch (sort) {
    case ApiWaveScoreSort.Balanced:
    case ApiWaveScoreSort.Quality:
    case ApiWaveScoreSort.Hotness:
    case ApiWaveScoreSort.Rep:
      return true;
    case "NEWEST":
    case "LATEST_POSTS":
      return false;
    default: {
      const exhaustiveSort: never = sort;
      return exhaustiveSort;
    }
  }
};

function RecommendationsExplorer() {
  const locale = useBrowserLocale();
  const { canUseCollections } = useWaveDiscoveryViewer();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = normalizeDiscoveryParams(searchParams).toString();
  const returnTo = currentQuery ? `${pathname}?${currentQuery}` : pathname;
  const activeSort = parseSort(searchParams?.get(SORT_PARAM) ?? null);
  const activeFilter = parseFilter(searchParams?.get(FILTER_PARAM) ?? null);
  const filterScores = useMemo(
    () => getFilterScores(activeFilter),
    [activeFilter]
  );
  const activeSortLabel = t(
    locale,
    SORT_OPTIONS.find((option) => option.value === activeSort)?.label ??
      "waves.discovery.sort.balanced"
  );
  const activeSortIsScoreSort = isScoreSort(activeSort);
  const visibleActiveFilter = activeSortIsScoreSort ? activeFilter : "ALL";
  const activeView =
    activeSort === "NEWEST"
      ? ApiWavesV2ListType.Search
      : ApiWavesV2ListType.Overview;
  const activeOverviewType =
    activeSort === "LATEST_POSTS"
      ? ApiWavesOverviewType.RecentlyDroppedTo
      : WAVE_SCORE_DISCOVERY_PARAMS.overviewType;
  const activeScoreSort = activeSortIsScoreSort ? activeSort : undefined;
  const activeFilterScores: DiscoverFilterScores = activeSortIsScoreSort
    ? filterScores
    : {};
  let title = t(locale, "waves.discovery.activeDiscussions");
  if (canUseCollections)
    title = t(locale, "waves.discovery.unfollowedDiscussions");
  if (activeSort === "NEWEST") title = t(locale, "waves.discovery.newestWaves");

  const updateParams = useCallback(
    (updates: {
      readonly sort?: DiscoverSort | undefined;
      readonly filter?: DiscoverScoreFilter | undefined;
    }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      const nextSort = updates.sort ?? activeSort;
      const nextFilter = isScoreSort(nextSort)
        ? (updates.filter ?? activeFilter)
        : "ALL";

      if (nextSort === WAVE_SCORE_DISCOVERY_PARAMS.scoreSort) {
        params.delete(SORT_PARAM);
      } else {
        params.set(SORT_PARAM, nextSort);
      }

      if (nextFilter === "ALL") {
        params.delete(FILTER_PARAM);
      } else {
        params.set(FILTER_PARAM, nextFilter);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [activeFilter, activeSort, pathname, router, searchParams]
  );

  return (
    <ExploreWavesSection
      headingVariant="page"
      title={title}
      subtitle={null}
      limit={20}
      viewAllHref={null}
      excludeFollowed={activeSort !== "NEWEST"}
      view={activeView}
      overviewType={activeOverviewType}
      directMessage={false}
      scoreSort={activeScoreSort}
      minVisibilityScore={activeFilterScores.minVisibilityScore}
      minQualityScore={activeFilterScores.minQualityScore}
      minHotnessScore={activeFilterScores.minHotnessScore}
      minRepSortScore={activeFilterScores.minRepSortScore}
      statusLabel={t(locale, "waves.discovery.sort.status", {
        sort: activeSortLabel,
      })}
      showEmptyState={true}
      emptyStateLabel={t(locale, "waves.discovery.filter.empty")}
      headerActions={<ScoreFormulaLink returnTo={returnTo} />}
      headerControls={
        <DiscoverWaveControls
          activeFilter={visibleActiveFilter}
          activeSort={activeSort}
          scoreFiltersEnabled={activeSortIsScoreSort}
          onFilterChange={(filter) => updateParams({ filter })}
          onSortChange={(sort) => updateParams({ sort })}
        />
      }
    />
  );
}

const ACTIVE_VOTES_VIEW = "active-votes";

function normalizeDiscoveryParams(
  params: ReturnType<typeof useSearchParams> | null
) {
  return new URLSearchParams(params?.toString() ?? "");
}

export function DiscoverWaveExplorer() {
  const locale = useBrowserLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = normalizeDiscoveryParams(useSearchParams());
  const panelId = useId();
  const active = params.get("view") === ACTIVE_VOTES_VIEW;
  const views = ["recommendations", ACTIVE_VOTES_VIEW] as const;
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const selectView = (view: (typeof views)[number]) => {
    const next = new URLSearchParams(params);
    next.set("view", view);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  return (
    <>
      <div
        role="tablist"
        aria-label={t(locale, "waves.discovery.label")}
        className="tw-m-0 tw-flex tw-min-w-0 tw-gap-6 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-pb-0 tw-pt-2 md:tw-px-6 lg:tw-px-8"
      >
        {views.map((view, index) => (
          <button
            key={view}
            type="button"
            ref={(element) => {
              tabsRef.current[index] = element;
            }}
            id={`${panelId}-${view}-tab`}
            role="tab"
            tabIndex={active === (view === ACTIVE_VOTES_VIEW) ? 0 : -1}
            aria-selected={active === (view === ACTIVE_VOTES_VIEW)}
            aria-controls={`${panelId}-${view}`}
            onClick={() => selectView(view)}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "Home") next = 0;
              else if (event.key === "End") next = 1;
              else if (event.key === "ArrowLeft" || event.key === "ArrowRight")
                next = 1 - index;
              else return;
              event.preventDefault();
              selectView(views[next]!);
              tabsRef.current[next]?.focus();
            }}
            className={`-tw-mb-px tw-min-h-11 tw-whitespace-nowrap tw-rounded-none tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-0 tw-py-2 tw-text-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${active === (view === ACTIVE_VOTES_VIEW) ? "tw-border-primary-400 tw-font-semibold tw-text-white" : "tw-border-transparent tw-font-medium tw-text-iron-400"}`}
          >
            {t(
              locale,
              view === ACTIVE_VOTES_VIEW
                ? "waves.discovery.activeVotes"
                : "waves.discovery.recommendations"
            )}
          </button>
        ))}
      </div>
      {views.map((view) => (
        <div
          key={view}
          id={`${panelId}-${view}`}
          role="tabpanel"
          aria-labelledby={`${panelId}-${view}-tab`}
          tabIndex={0}
          hidden={active !== (view === ACTIVE_VOTES_VIEW)}
        >
          {active === (view === ACTIVE_VOTES_VIEW) &&
            (active ? <ActiveWaveVotes /> : <RecommendationsExplorer />)}
        </div>
      ))}
    </>
  );
}
