"use client";

import { WAVE_SCORE_DISCOVERY_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import {
  CalendarDaysIcon,
  CalculatorIcon,
  ClockIcon,
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useCallback, useMemo } from "react";

type DiscoverScoreFilter = "ALL" | "SCORE_50" | "HOT_60" | "REP_60";
type DiscoverChronologySort = "NEWEST" | "LATEST_POSTS";
type DiscoverSort = ApiWaveScoreSort | DiscoverChronologySort;

interface DiscoverFilterScores {
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
}

interface DiscoverSortOption {
  readonly value: DiscoverSort;
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
  { value: "NEWEST", label: "Newest" },
  { value: "LATEST_POSTS", label: "Latest Posts" },
];

const FILTER_OPTIONS: readonly DiscoverFilterOption[] = [
  { value: "ALL", label: "All" },
  { value: "SCORE_50", label: "Score 50+" },
  { value: "HOT_60", label: "Hot 60+" },
  { value: "REP_60", label: "REP 60+" },
];

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

function focusRadioByValue(container: HTMLElement | null, value: string): void {
  container
    ?.querySelector<HTMLElement>(`[data-radio-value="${CSS.escape(value)}"]`)
    ?.focus();
}

function getNextIndex({
  currentIndex,
  key,
  optionsLength,
}: {
  readonly currentIndex: number;
  readonly key: string;
  readonly optionsLength: number;
}): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (currentIndex + 1) % optionsLength;
    case "ArrowLeft":
    case "ArrowUp":
      return (currentIndex - 1 + optionsLength) % optionsLength;
    case "Home":
      return 0;
    case "End":
      return optionsLength - 1;
    default:
      return null;
  }
}

function onRadioKeyDown<T extends string>({
  activeValue,
  event,
  onChange,
  options,
}: {
  readonly activeValue: T;
  readonly event: KeyboardEvent<HTMLButtonElement>;
  readonly onChange: (value: T) => void;
  readonly options: readonly { readonly value: T }[];
}) {
  const currentIndex = options.findIndex(
    (option) => option.value === activeValue
  );
  const nextIndex = getNextIndex({
    currentIndex: currentIndex < 0 ? 0 : currentIndex,
    key: event.key,
    optionsLength: options.length,
  });

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  const nextValue = options[nextIndex]?.value;
  if (!nextValue) {
    return;
  }

  const radioGroup = event.currentTarget.parentElement;
  onChange(nextValue);
  requestAnimationFrame(() => focusRadioByValue(radioGroup, nextValue));
}

function ScoreSortIcon({ sort }: { readonly sort: DiscoverSort }) {
  switch (sort) {
    case ApiWaveScoreSort.Hotness:
      return <FireIcon className="tw-size-4" aria-hidden="true" />;
    case ApiWaveScoreSort.Rep:
      return <ScaleIcon className="tw-size-4" aria-hidden="true" />;
    case ApiWaveScoreSort.Quality:
      return <ShieldCheckIcon className="tw-size-4" aria-hidden="true" />;
    case ApiWaveScoreSort.Balanced:
      return <Squares2X2Icon className="tw-size-4" aria-hidden="true" />;
    case "NEWEST":
      return <CalendarDaysIcon className="tw-size-4" aria-hidden="true" />;
    case "LATEST_POSTS":
      return <ClockIcon className="tw-size-4" aria-hidden="true" />;
  }
}

function DiscoverWaveControls({
  activeFilter,
  activeSort,
  onFilterChange,
  onSortChange,
}: {
  readonly activeFilter: DiscoverScoreFilter;
  readonly activeSort: DiscoverSort;
  readonly onFilterChange: (filter: DiscoverScoreFilter) => void;
  readonly onSortChange: (sort: DiscoverSort) => void;
}) {
  const scoreFiltersEnabled = isScoreSort(activeSort);

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 md:tw-w-auto md:tw-items-end">
      <Link
        href="/network/wave-score"
        className="tw-inline-flex tw-h-8 tw-items-center tw-justify-center tw-gap-1.5 tw-self-start tw-rounded-md tw-bg-iron-950 tw-px-2.5 tw-text-xs tw-font-semibold tw-text-iron-200 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white md:tw-self-end"
      >
        <CalculatorIcon className="tw-size-4" aria-hidden="true" />
        Score formula
      </Link>
      <div
        role="radiogroup"
        className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-white/10 sm:tw-grid-cols-3 md:tw-w-auto xl:tw-grid-cols-6"
        aria-label="Wave discovery sort"
      >
        {SORT_OPTIONS.map((option) => {
          const selected = activeSort === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-radio-value={option.value}
              onClick={() => onSortChange(option.value)}
              onKeyDown={(event) =>
                onRadioKeyDown({
                  activeValue: activeSort,
                  event,
                  onChange: onSortChange,
                  options: SORT_OPTIONS,
                })
              }
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
        role="radiogroup"
        className={`tw-flex tw-w-full tw-flex-wrap tw-gap-1.5 tw-transition-opacity md:tw-justify-end ${
          scoreFiltersEnabled ? "tw-opacity-100" : "tw-opacity-55"
        }`}
        aria-label="Wave score filters"
        aria-disabled={!scoreFiltersEnabled}
      >
        {FILTER_OPTIONS.map((option) => {
          const selected = activeFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!scoreFiltersEnabled}
              tabIndex={scoreFiltersEnabled && selected ? 0 : -1}
              data-radio-value={option.value}
              onClick={() => onFilterChange(option.value)}
              onKeyDown={(event) =>
                onRadioKeyDown({
                  activeValue: activeFilter,
                  event,
                  onChange: onFilterChange,
                  options: FILTER_OPTIONS,
                })
              }
              className={`tw-h-8 tw-rounded-md tw-border-0 tw-px-2.5 tw-text-xs tw-font-medium tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                selected
                  ? "tw-text-primary-100 tw-bg-primary-500/20 tw-ring-1 tw-ring-inset tw-ring-primary-400/40"
                  : "tw-bg-iron-950 tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-white/10 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-950 disabled:tw-text-iron-600 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
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
    () => getFilterScores(activeFilter),
    [activeFilter]
  );
  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.value === activeSort)?.label ??
    "Balanced";
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
  const title =
    activeSort === "NEWEST"
      ? "Newest waves"
      : "Active discussions you are not yet following";

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
      statusLabel={`${activeSortLabel} waves`}
      showEmptyState={true}
      emptyStateLabel="No waves match these filters."
      headerControls={
        <DiscoverWaveControls
          activeFilter={visibleActiveFilter}
          activeSort={activeSort}
          onFilterChange={(filter) => updateParams({ filter })}
          onSortChange={(sort) => updateParams({ sort })}
        />
      }
    />
  );
}
