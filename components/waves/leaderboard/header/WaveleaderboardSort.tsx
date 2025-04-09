import React from "react";
import { WaveDropsLeaderboardSort } from "../../../../hooks/useWaveDropsLeaderboard";

interface WaveleaderboardSortProps {
  readonly sort: WaveDropsLeaderboardSort;
  readonly onSortChange: (sort: WaveDropsLeaderboardSort) => void;
}

export const WaveleaderboardSort: React.FC<WaveleaderboardSortProps> = ({
  sort,
  onSortChange,
}) => {
  const getButtonClassName = (buttonSort: WaveDropsLeaderboardSort) => {
    const baseClass =
      "tw-px-2.5 tw-py-1.5 tw-border-0 tw-rounded-md tw-transition tw-duration-300 tw-ease-out";

    if (sort === buttonSort) {
      return `${baseClass} tw-bg-iron-800 tw-text-iron-50 tw-font-medium`;
    }

    return `${baseClass} tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent`;
  };

  return (
    <div
      id="tabsId"
      className="tw-flex tw-items-center tw-whitespace-nowrap tw-h-9 tw-px-1 tw-text-xs tw-border tw-border-iron-800 tw-border-solid tw-rounded-lg tw-overflow-hidden"
    >
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.RANK)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.RANK)}
      >
        Current Vote
      </button>
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.RATING_PREDICTION)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.RATING_PREDICTION)}
      >
        Projected Vote
      </button>
      <button
        className={getButtonClassName(WaveDropsLeaderboardSort.CREATED_AT)}
        onClick={() => onSortChange(WaveDropsLeaderboardSort.CREATED_AT)}
      >
        Newest
      </button>
    </div>
  );
};
