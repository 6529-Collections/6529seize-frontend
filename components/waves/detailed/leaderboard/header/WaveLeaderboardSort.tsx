import React from "react";
import { WaveLeaderboardSortType } from "../WaveLeaderboard";

interface WaveLeaderboardSortProps {
  readonly sort: WaveLeaderboardSortType;
  readonly setSort: (sort: WaveLeaderboardSortType) => void;
}

export const WaveLeaderboardSort: React.FC<WaveLeaderboardSortProps> = ({
  sort,
  setSort,
}) => {
  return (
    <div className="tw-flex tw-items-center tw-bg-iron-900/40 tw-backdrop-blur-sm tw-p-0.5 tw-rounded-lg tw-gap-x-1">
      <button
        onClick={() => setSort(WaveLeaderboardSortType.RANK)}
        className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg ${
          sort === WaveLeaderboardSortType.RANK
            ? "tw-bg-iron-800/80 tw-text-white"
            : "tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800/60 hover:tw-text-white"
        }`}
      >
        Top Rated
      </button>
      <button
        onClick={() => setSort(WaveLeaderboardSortType.RECENT)}
        className={`tw-border-0 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg ${
          sort === WaveLeaderboardSortType.RECENT
            ? "tw-bg-iron-800/80 tw-text-white"
            : "tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800/60 hover:tw-text-white"
        }`}
      >
        Recent
      </button>
    </div>
  );
};
