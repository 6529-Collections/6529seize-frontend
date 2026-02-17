"use client";

import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import React from "react";

interface WaveleaderboardSortProps {
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
  readonly mode?: WaveleaderboardSortMode;
}

type WaveleaderboardSortMode = "tabs" | "dropdown";

export const WAVE_LEADERBOARD_SORT_ITEMS: readonly CommonSelectItem<WaveDropsLeaderboardSort>[] =
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

export const WaveleaderboardSort: React.FC<WaveleaderboardSortProps> = ({
  sort,
  onSortChange,
  mode = "dropdown",
}) => {
  const getTabClassName = (value: WaveDropsLeaderboardSort): string => {
    const baseClass =
      "tw-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-px-3 tw-py-2.5 tw-text-xs tw-font-semibold tw-transition-colors tw-ring-1 tw-ring-inset";

    if (sort === value) {
      return `${baseClass} tw-ring-iron-600 tw-bg-iron-800 tw-text-iron-200`;
    }

    return `${baseClass} tw-ring-transparent tw-bg-transparent tw-text-iron-500 desktop-hover:hover:tw-ring-iron-700 desktop-hover:hover:tw-text-iron-300`;
  };

  if (mode === "tabs") {
    return (
      <div
        role="tablist"
        aria-label="Sort options"
        className="tw-flex tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-iron-950 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-iron-700"
      >
        {WAVE_LEADERBOARD_SORT_ITEMS.map((item) => (
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
        items={WAVE_LEADERBOARD_SORT_ITEMS}
        activeItem={sort}
        filterLabel="Sort"
        setSelected={onSortChange}
        size="sm"
        showFilterLabel={true}
      />
    </div>
  );
};
