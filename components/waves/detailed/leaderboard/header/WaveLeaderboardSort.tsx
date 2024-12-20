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
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <button
        onClick={() => setSort(WaveLeaderboardSortType.RANK)}
        className={`tw-whitespace-nowrap tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
          sort === WaveLeaderboardSortType.RANK
            ? "tw-bg-iron-800 tw-text-white tw-border-iron-800/80"
            : "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800/80 desktop-hover:hover:tw-border-iron-800/80 tw-border-transparent"
        }`}
      >
        Top Voted
      </button>
      <button
        onClick={() => setSort(WaveLeaderboardSortType.RECENT)}
        className={`tw-whitespace-nowrap tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
          sort === WaveLeaderboardSortType.RECENT
            ? "tw-bg-iron-800 tw-text-white tw-border-iron-800/80"
            : "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800/80 desktop-hover:hover:tw-border-iron-800/80 tw-border-transparent"
        }`}
      >
        Recent
      </button>
    </div>
  );
};
