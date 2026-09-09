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
      "tw-flex tw-h-[30px] tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-2.5 tw-py-0 tw-text-xs tw-font-medium tw-leading-5 tw-transition-[color,background-color,box-shadow] tw-duration-200 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-1 focus-visible:tw-ring-offset-iron-900 motion-reduce:tw-transition-none";

    if (sort === value) {
      return `${baseClass} tw-bg-iron-800/90 tw-text-iron-50 tw-shadow-sm tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-white/[0.06]`;
    }

    return `${baseClass} tw-border-transparent tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-bg-iron-800/50 desktop-hover:hover:tw-text-iron-200`;
  };

  if (mode === "tabs") {
    return (
      <div
        role="tablist"
        aria-label="Sort options"
        className="tw-box-border tw-flex tw-h-[38px] tw-flex-shrink-0 tw-items-center tw-gap-x-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900/75 tw-p-1 tw-shadow-sm tw-shadow-black/30 tw-backdrop-blur"
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
        variant="toolbar"
        showFilterLabel={true}
      />
    </div>
  );
};
