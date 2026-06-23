"use client";

import React, { useCallback } from "react";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import { WaveLeaderboardLoading } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoading";
import { WaveLeaderboardLoadingBar } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar";
import { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import useLocalPreference from "@/hooks/useLocalPreference";
import { useWavePollDrops } from "@/hooks/useWavePollDrops";
import type {
  WavePollsSort as WavePollsApiSort,
  WavePollsState,
} from "@/services/api/wave-drops-v2-api";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamWavePollsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

type WavePollsStateFilter = "ALL" | "OPEN" | "CLOSED";
type WavePollsSortOption =
  | "NEWEST"
  | "OLDEST"
  | "CLOSING_SOON"
  | "CLOSING_LATEST";

interface WavePollsStateFilterItem {
  readonly label: string;
  readonly value: WavePollsStateFilter;
  readonly apiState?: WavePollsState | undefined;
  readonly emptyLabel: string;
}

interface WavePollsSortItem extends CommonSelectItem<WavePollsSortOption> {
  readonly sortDirection: ApiPageSortDirection;
  readonly sort: WavePollsApiSort;
}

const DEFAULT_STATE_FILTER_ITEM: WavePollsStateFilterItem = {
  label: "All",
  value: "ALL",
  emptyLabel: "No polls to show.",
};

const STATE_FILTER_ITEMS: readonly WavePollsStateFilterItem[] = [
  DEFAULT_STATE_FILTER_ITEM,
  {
    label: "Open",
    value: "OPEN",
    apiState: "OPEN",
    emptyLabel: "No open polls.",
  },
  {
    label: "Closed",
    value: "CLOSED",
    apiState: "CLOSED",
    emptyLabel: "No closed polls.",
  },
];

const DEFAULT_SORT_ITEM: WavePollsSortItem = {
  key: "newest",
  label: "Newest",
  value: "NEWEST",
  sortDirection: ApiPageSortDirection.Desc,
  sort: "created_at",
};

const SORT_ITEMS: readonly WavePollsSortItem[] = [
  DEFAULT_SORT_ITEM,
  {
    key: "oldest",
    label: "Oldest",
    value: "OLDEST",
    sortDirection: ApiPageSortDirection.Asc,
    sort: "created_at",
  },
  {
    key: "closing-soon",
    label: "Closing soon",
    value: "CLOSING_SOON",
    sortDirection: ApiPageSortDirection.Asc,
    sort: "closing_time",
  },
  {
    key: "closing-latest",
    label: "Closing latest",
    value: "CLOSING_LATEST",
    sortDirection: ApiPageSortDirection.Desc,
    sort: "closing_time",
  },
];

const hasOptionValue = <T extends string>(
  items: readonly { readonly value: T }[],
  value: unknown
): value is T =>
  typeof value === "string" && items.some((item) => item.value === value);

const isWavePollsStateFilter = (
  value: unknown
): value is WavePollsStateFilter => hasOptionValue(STATE_FILTER_ITEMS, value);

const isWavePollsSort = (value: unknown): value is WavePollsSortOption =>
  hasOptionValue(SORT_ITEMS, value);

const getStateFilterItem = (
  value: WavePollsStateFilter
): WavePollsStateFilterItem =>
  STATE_FILTER_ITEMS.find((item) => item.value === value) ??
  DEFAULT_STATE_FILTER_ITEM;

const getSortItem = (value: WavePollsSortOption): WavePollsSortItem =>
  SORT_ITEMS.find((item) => item.value === value) ?? DEFAULT_SORT_ITEM;

const getStateFilterClassName = (active: boolean): string => {
  const baseClass =
    "tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-leading-5 tw-transition-all tw-duration-300 tw-ease-out";

  if (active) {
    return `${baseClass} tw-bg-iron-800 tw-text-iron-100`;
  }

  return `${baseClass} tw-bg-iron-950 tw-text-iron-500 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100`;
};

const noop = () => {};

const MyStreamWavePolls: React.FC<MyStreamWavePollsProps> = ({
  wave,
  onDropClick,
}) => {
  const { leaderboardViewStyle } = useLayout();
  const [stateFilter, setStateFilter] =
    useLocalPreference<WavePollsStateFilter>(
      `wavePollState_${wave.id}`,
      "ALL",
      isWavePollsStateFilter
    );
  const [sort, setSort] = useLocalPreference<WavePollsSortOption>(
    `wavePollSort_${wave.id}`,
    "NEWEST",
    isWavePollsSort
  );
  const { winningThreshold, winningThresholdMinDurationMs } =
    useApprovalWaveStatus({ wave });
  const stateFilterItem = getStateFilterItem(stateFilter);
  const sortItem = getSortItem(sort);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useWavePollDrops({
    wave,
    state: stateFilterItem.apiState,
    sortDirection: sortItem.sortDirection,
    sort: sortItem.sort,
  });

  const handleRetry = useCallback(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  const handleIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetching || isFetchingNextPage) {
        return;
      }

      fetchNextPage().catch(() => undefined);
    },
    [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]
  );
  const intersectionElementRef = useIntersectionObserver(handleIntersection);

  let content: React.ReactNode;
  if (isError && drops.length === 0) {
    content = (
      <div className="tw-mt-10 tw-flex tw-flex-col tw-items-center tw-gap-4 tw-text-center">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
          Unable to load polls.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-500 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-iron-300 desktop-hover:hover:tw-bg-iron-800"
        >
          Try again
        </button>
      </div>
    );
  } else if (isFetching && drops.length === 0) {
    content = <WaveLeaderboardLoading />;
  } else if (drops.length === 0) {
    content = (
      <div className="tw-mt-10">
        <p className="tw-text-center tw-text-sm tw-text-iron-500">
          {stateFilterItem.emptyLabel}
        </p>
      </div>
    );
  } else {
    content = (
      <div className="tw-mt-4 tw-space-y-2">
        {drops.map((drop) => (
          <Drop
            key={drop.stableKey}
            drop={drop}
            previousDrop={null}
            nextDrop={null}
            showWaveInfo={false}
            activeDrop={null}
            showReplyAndQuote={false}
            location={DropLocation.WAVE}
            dropViewDropId={null}
            onReply={noop}
            onReplyClick={noop}
            onQuoteClick={noop}
            onDropContentClick={onDropClick}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          />
        ))}
        {isFetchingNextPage && <WaveLeaderboardLoadingBar />}
        <div ref={intersectionElementRef}></div>
      </div>
    );
  }

  return (
    <div
      className="tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 lg:tw-space-y-6"
      style={leaderboardViewStyle}
    >
      <div className="tw-sticky tw-top-0 tw-z-30 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-bg-black tw-py-4">
        <div
          role="tablist"
          aria-label="Poll state"
          className="tw-flex tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-800"
        >
          {STATE_FILTER_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-label={item.label}
              aria-selected={stateFilter === item.value}
              tabIndex={stateFilter === item.value ? 0 : -1}
              className={getStateFilterClassName(stateFilter === item.value)}
              onClick={() => setStateFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="tw-w-44 tw-min-w-0">
          <CommonDropdown<WavePollsSortOption>
            items={SORT_ITEMS}
            activeItem={sort}
            filterLabel="Sort"
            setSelected={setSort}
            size="sm"
            showFilterLabel={true}
          />
        </div>
      </div>

      {content}
    </div>
  );
};

export default MyStreamWavePolls;
