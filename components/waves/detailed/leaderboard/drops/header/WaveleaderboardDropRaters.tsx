import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

interface WaveLeaderboardDropRatersProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropRaters: React.FC<
  WaveLeaderboardDropRatersProps
> = ({ drop }) => {
  const votersCountLabel = drop.raters_count === 1 ? "voter" : "voters";
  const votingsLabel = drop.rating === 1 ? "vote" : "votes";

  const topThreeRankStyles: {
    [key: number]: string;
  } = {
    1: "tw-text-[#E8D48A]",
    2: "tw-text-[#dddddd]",
    3: "tw-text-[#CD7F32]",
  };

  const rankStyle = drop.rank && drop.rank <= 3 ? topThreeRankStyles[drop.rank] : "tw-text-iron-300";

  return (
    <div className="tw-px-4 tw-py-1.5 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          {formatNumberWithCommas(drop.raters_count)} {votersCountLabel}
        </span>
        <div className="tw-size-1 tw-bg-iron-700 tw-rounded-full"></div>
        <span className={`tw-text-sm tw-font-normal ${rankStyle}`}>
          {formatNumberWithCommas(drop.rating)}{" "}
          <span className="tw-text-iron-400"> {votingsLabel}</span>
        </span>
      </div>
    </div>
  );
};
