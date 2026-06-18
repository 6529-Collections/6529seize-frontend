"use client";

import { WAVE_SCORE_DISCOVERY_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
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

const SORT_ITEMS: readonly CommonSelectItem<DiscoverSort>[] = SORT_OPTIONS.map(
  (option) => ({
    key: option.value,
    label: option.label,
    value: option.value,
    icon: <ScoreSortIcon sort={option.value} />,
  })
);

function ScoreFormulaLink() {
  return (
    <Link
      href="/network/wave-score"
      aria-label="View wave score formula"
      className="tw-inline-flex tw-h-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-px-3 tw-text-xs tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100"
    >
      <CalculatorIcon className="tw-size-4" aria-hidden="true" />
      Score formula
    </Link>
  );
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
    <fieldset className="tw-m-0 tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-black/20 tw-p-1.5 tw-ring-1 tw-ring-inset tw-ring-white/5 xl:tw-flex-row xl:tw-items-center">
      <legend className="tw-sr-only">Discovery controls</legend>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-y-3 xl:tw-flex-row xl:tw-items-center xl:tw-gap-x-4">
        <div className="tw-min-w-0">
          <CommonTabs<DiscoverSort>
            items={SORT_ITEMS}
            activeItem={activeSort}
            filterLabel="Wave discovery sort"
            setSelected={onSortChange}
            size="sm"
            fill={false}
          />
        </div>
        <div
          className="tw-hidden tw-h-6 tw-w-px tw-flex-shrink-0 tw-bg-white/10 xl:tw-block"
          aria-hidden="true"
        />
        <div className="horizontal-menu-hide-scrollbar tw-flex tw-min-w-0 tw-items-center tw-gap-4 tw-overflow-x-auto tw-scroll-smooth tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60">
          <div
            role="radiogroup"
            className={`tw-flex tw-flex-shrink-0 tw-flex-nowrap tw-gap-1.5 tw-transition-opacity ${
              scoreFiltersEnabled ? "tw-opacity-100" : "tw-opacity-70"
            }`}
            aria-label="Wave score threshold"
            aria-disabled={!scoreFiltersEnabled}
          >
            {FILTER_OPTIONS.map((option) => {
              const selected = activeFilter === option.value;
              const visuallySelected = selected && scoreFiltersEnabled;
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
                  className={`tw-flex tw-h-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-text-xs tw-font-medium tw-leading-5 tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
                    visuallySelected
                      ? "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-400 desktop-hover:hover:tw-border-primary-400/70 desktop-hover:hover:tw-bg-primary-500/15 desktop-hover:hover:tw-text-primary-300"
                      : "tw-border-white/5 tw-bg-iron-950 tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <ScoreFormulaLink />
        </div>
      </div>
    </fieldset>
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
