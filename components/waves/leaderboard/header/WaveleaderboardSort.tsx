"use client";

import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import React from "react";

interface WaveleaderboardSortProps {
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
  readonly mode?: WaveleaderboardSortMode;
  readonly items?:
    | readonly CommonSelectItem<WaveDropsLeaderboardSort>[]
    | undefined;
}

type WaveleaderboardSortMode = "tabs" | "dropdown";

const WAVE_LEADERBOARD_SORT_ITEMS: readonly CommonSelectItem<WaveDropsLeaderboardSort>[] =
  [
    {
      key: WaveDropsLeaderboardSort.RANK,
      label: "Current Vote",
      value: WaveDropsLeaderboardSort.RANK,
    },
    {
      key: WaveDropsLeaderboardSort.RATING_PREDICTION,
      label: "Projected Vote",
      value: WaveDropsLeaderboardSort.RATING_PREDICTION,
    },
    {
      key: WaveDropsLeaderboardSort.TREND,
      label: "Hot",
      value: WaveDropsLeaderboardSort.TREND,
    },
    {
      key: WaveDropsLeaderboardSort.CREATED_AT,
      label: "Newest",
      value: WaveDropsLeaderboardSort.CREATED_AT,
    },
  ];

const WAVE_LEADERBOARD_APPROVE_SORT_ITEMS: readonly CommonSelectItem<WaveDropsLeaderboardSort>[] =
  [
    {
      key: WaveDropsLeaderboardSort.RANK,
      label: "Closest to approval",
      value: WaveDropsLeaderboardSort.RANK,
    },
    {
      key: WaveDropsLeaderboardSort.REALTIME_VOTE,
      label: "Votes Given Now",
      value: WaveDropsLeaderboardSort.REALTIME_VOTE,
    },
    {
      key: WaveDropsLeaderboardSort.TREND,
      label: "Hot",
      value: WaveDropsLeaderboardSort.TREND,
    },
    {
      key: WaveDropsLeaderboardSort.CREATED_AT,
      label: "Newest",
      value: WaveDropsLeaderboardSort.CREATED_AT,
    },
  ];

const WAVE_LEADERBOARD_CURATION_SORT_ITEMS: readonly CommonSelectItem<WaveDropsLeaderboardSort>[] =
  [
    ...WAVE_LEADERBOARD_SORT_ITEMS,
    {
      key: WaveDropsLeaderboardSort.PRICE,
      label: "Price",
      value: WaveDropsLeaderboardSort.PRICE,
    },
  ];

const WAVE_LEADERBOARD_APPROVE_CURATION_SORT_ITEMS: readonly CommonSelectItem<WaveDropsLeaderboardSort>[] =
  [
    ...WAVE_LEADERBOARD_APPROVE_SORT_ITEMS,
    {
      key: WaveDropsLeaderboardSort.PRICE,
      label: "Price",
      value: WaveDropsLeaderboardSort.PRICE,
    },
  ];

const hasWaveLeaderboardTimeLock = (
  timeLockMs: unknown
): timeLockMs is number =>
  typeof timeLockMs === "number" && Number.isFinite(timeLockMs);

const removeRatingPredictionSort = (
  items: readonly CommonSelectItem<WaveDropsLeaderboardSort>[]
): readonly CommonSelectItem<WaveDropsLeaderboardSort>[] =>
  items.filter(
    (item) =>
      item.value !== WaveDropsLeaderboardSort.RATING_PREDICTION &&
      item.value !== WaveDropsLeaderboardSort.REALTIME_VOTE
  );

export const getWaveLeaderboardSortItems = ({
  isApproveWave,
  isCurationWave,
  timeLockMs,
}: {
  readonly isApproveWave: boolean;
  readonly isCurationWave: boolean;
  readonly timeLockMs: unknown;
}): readonly CommonSelectItem<WaveDropsLeaderboardSort>[] => {
  let items: readonly CommonSelectItem<WaveDropsLeaderboardSort>[];

  if (isCurationWave) {
    items = isApproveWave
      ? WAVE_LEADERBOARD_APPROVE_CURATION_SORT_ITEMS
      : WAVE_LEADERBOARD_CURATION_SORT_ITEMS;
  } else if (isApproveWave) {
    items = WAVE_LEADERBOARD_APPROVE_SORT_ITEMS;
  } else {
    items = WAVE_LEADERBOARD_SORT_ITEMS;
  }

  if (hasWaveLeaderboardTimeLock(timeLockMs)) {
    return items;
  }

  return removeRatingPredictionSort(items);
};

export const normalizeWaveLeaderboardSort = ({
  isApproveWave,
  sort,
  timeLockMs,
}: {
  readonly isApproveWave: boolean;
  readonly sort: WaveDropsLeaderboardSort;
  readonly timeLockMs: unknown;
}): WaveDropsLeaderboardSort => {
  if (
    isApproveWave &&
    sort === WaveDropsLeaderboardSort.RATING_PREDICTION &&
    hasWaveLeaderboardTimeLock(timeLockMs)
  ) {
    return WaveDropsLeaderboardSort.REALTIME_VOTE;
  }

  if (
    !isApproveWave &&
    sort === WaveDropsLeaderboardSort.REALTIME_VOTE &&
    hasWaveLeaderboardTimeLock(timeLockMs)
  ) {
    return WaveDropsLeaderboardSort.RATING_PREDICTION;
  }

  if (
    (sort === WaveDropsLeaderboardSort.RATING_PREDICTION ||
      sort === WaveDropsLeaderboardSort.REALTIME_VOTE) &&
    !hasWaveLeaderboardTimeLock(timeLockMs)
  ) {
    return WaveDropsLeaderboardSort.RANK;
  }

  return sort;
};

export const WaveleaderboardSort: React.FC<WaveleaderboardSortProps> = ({
  sort,
  onSortChange,
  mode = "dropdown",
  items = WAVE_LEADERBOARD_SORT_ITEMS,
}) => {
  const getTabClassName = (value: WaveDropsLeaderboardSort): string => {
    const baseClass =
      "tw-flex tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-leading-5 tw-transition-all tw-duration-300 tw-ease-out";

    if (sort === value) {
      return `${baseClass} tw-bg-iron-800 tw-text-iron-100`;
    }

    return `${baseClass} tw-bg-iron-950 tw-text-iron-500 hover:tw-bg-iron-900 hover:tw-text-iron-100`;
  };

  if (mode === "tabs") {
    return (
      <div
        role="tablist"
        aria-label="Sort options"
        className="tw-flex tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-800"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-label={item.label}
            aria-selected={sort === item.value}
            tabIndex={sort === item.value ? 0 : -1}
            className={getTabClassName(item.value)}
            onClick={() => onSortChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="tw-min-w-0 tw-flex-shrink-0">
      <CommonDropdown<WaveDropsLeaderboardSort>
        items={items}
        activeItem={sort}
        filterLabel="Sort"
        setSelected={onSortChange}
        size="sm"
        showFilterLabel={true}
      />
    </div>
  );
};
