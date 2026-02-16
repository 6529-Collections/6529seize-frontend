"use client";

import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import React, { useMemo } from "react";

interface WaveleaderboardSortProps {
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
}

export const WaveleaderboardSort: React.FC<WaveleaderboardSortProps> = ({
  sort,
  onSortChange,
}) => {
  const sortItems = useMemo<
    readonly CommonSelectItem<WaveDropsLeaderboardSort>[]
  >(
    () => [
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
    ],
    []
  );

  return (
    <div className="tw-min-w-0">
      <CommonDropdown<WaveDropsLeaderboardSort>
        items={sortItems}
        activeItem={sort}
        filterLabel="Sort"
        setSelected={onSortChange}
        size="sm"
        showFilterLabel={true}
      />
    </div>
  );
};
