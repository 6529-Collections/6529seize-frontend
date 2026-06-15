"use client";

import { WAVE_SCORE_DISCOVERY_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import {
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type DiscoverScoreFilter = "ALL" | "SCORE_50" | "HOT_60" | "REP_60";

interface DiscoverFilterScores {
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
}

interface DiscoverSortOption {
  readonly value: ApiWaveScoreSort;
  readonly label: string;
}

interface DiscoverFilterOption {
  readonly value: DiscoverScoreFilter;
  readonly label: string;
}

const SORT_PARAM = "sort";
const FILTER_PARAM = "filter";

const SORT_OPTIONS: readonly DiscoverSortOption[] = [
  { value: ApiWaveScoreSort.Balanced, label: "Balanced" },
  { value: ApiWaveScoreSort.Quality, label: "Quality" },
  { value: ApiWaveScoreSort.Hotness, label: "Hot" },
  { value: ApiWaveScoreSort.Rep, label: "REP" },
];

const FILTER_OPTIONS: readonly DiscoverFilterOption[] = [
  { value: "ALL", label: "All" },
  { value: "SCORE_50", label: "Score 50+" },
  { value: "HOT_60", label: "Hot 60+" },
  { value: "REP_60", label: "REP 60+" },
];

const parseSort = (value: string | null): ApiWaveScoreSort => {
  if (
    value === ApiWaveScoreSort.Quality ||
    value === ApiWaveScoreSort.Hotness ||
    value === ApiWaveScoreSort.Rep
  ) {
    return value;
  }

  return WAVE_SCORE_DISCOVERY_PARAMS.scoreSort;
};

const parseFilter = (value: string | null): DiscoverScoreFilter => {
  if (value === "SCORE_50" || value === "HOT_60" || value === "REP_60") {
    return value;
  }

  return "ALL";
};

const getFilterScores = (
  filter: DiscoverScoreFilter,
  sort: ApiWaveScoreSort
): DiscoverFilterScores => {
  const scores =
    filter === "SCORE_50"
      ? { minVisibilityScore: 50 }
      : filter === "HOT_60"
        ? { minHotnessScore: 60 }
        : filter === "REP_60"
          ? { minRepSortScore: 60 }
          : {};

  return sort === ApiWaveScoreSort.Quality
    ? { ...scores, minQualityScore: 50 }
    : scores;
};

function ScoreSortIcon({ sort }: { readonly sort: ApiWaveScoreSort }) {
  switch (sort) {
    case ApiWaveScoreSort.Hotness:
      return <FireIcon className="tw-size-4" aria-hidden="true" />;
    case ApiWaveScoreSort.Rep:
      return <ScaleIcon className="tw-size-4" aria-hidden="true" />;
    case ApiWaveScoreSort.Quality:
      return <ShieldCheckIcon className="tw-size-4" aria-hidden="true" />;
    case ApiWaveScoreSort.Balanced:
      return <Squares2X2Icon className="tw-size-4" aria-hidden="true" />;
  }
}

function DiscoverWaveControls({
  activeFilter,
  activeSort,
  onFilterChange,
  onSortChange,
}: {
  readonly activeFilter: DiscoverScoreFilter;
  readonly activeSort: ApiWaveScoreSort;
  readonly onFilterChange: (filter: DiscoverScoreFilter) => void;
  readonly onSortChange: (sort: ApiWaveScoreSort) => void;
}) {
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 md:tw-w-auto md:tw-items-end">
      <div
        role="group"
        className="tw-grid tw-w-full tw-grid-cols-4 tw-gap-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-white/10 md:tw-w-auto"
        aria-label="Wave score sort"
      >
        {SORT_OPTIONS.map((option) => {
          const selected = activeSort === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onSortChange(option.value)}
              className={`tw-inline-flex tw-h-9 tw-min-w-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-px-2 tw-text-xs tw-font-medium tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                selected
                  ? "tw-bg-iron-700 tw-text-white"
                  : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              }`}
            >
              <ScoreSortIcon sort={option.value} />
              <span className="tw-truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
      <div
        role="group"
        className="tw-flex tw-w-full tw-flex-wrap tw-gap-1.5 md:tw-justify-end"
        aria-label="Wave score filters"
      >
        {FILTER_OPTIONS.map((option) => {
          const selected = activeFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onFilterChange(option.value)}
              className={`tw-h-8 tw-rounded-md tw-border-0 tw-px-2.5 tw-text-xs tw-font-medium tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                selected
                  ? "tw-text-primary-100 tw-bg-primary-500/20 tw-ring-1 tw-ring-inset tw-ring-primary-400/40"
                  : "tw-bg-iron-950 tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-white/10 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DiscoverWaveExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = parseSort(searchParams?.get(SORT_PARAM) ?? null);
  const activeFilter = parseFilter(searchParams?.get(FILTER_PARAM) ?? null);
  const filterScores = useMemo(
    () => getFilterScores(activeFilter, activeSort),
    [activeFilter, activeSort]
  );
  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.value === activeSort)?.label ??
    "Balanced";

  const updateParams = useCallback(
    (updates: {
      readonly sort?: ApiWaveScoreSort | undefined;
      readonly filter?: DiscoverScoreFilter | undefined;
    }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      const nextSort = updates.sort ?? activeSort;
      const nextFilter = updates.filter ?? activeFilter;

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
      title="Active discussions you are not yet following"
      subtitle={null}
      limit={20}
      viewAllHref={null}
      excludeFollowed={true}
      overviewType={WAVE_SCORE_DISCOVERY_PARAMS.overviewType}
      scoreSort={activeSort}
      minVisibilityScore={filterScores.minVisibilityScore}
      minQualityScore={filterScores.minQualityScore}
      minHotnessScore={filterScores.minHotnessScore}
      minRepSortScore={filterScores.minRepSortScore}
      statusLabel={`${activeSortLabel} waves`}
      headerControls={
        <DiscoverWaveControls
          activeFilter={activeFilter}
          activeSort={activeSort}
          onFilterChange={(filter) => updateParams({ filter })}
          onSortChange={(sort) => updateParams({ sort })}
        />
      }
    />
  );
}
