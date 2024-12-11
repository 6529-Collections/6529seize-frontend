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
  const userVote = drop.context_profile_context?.rating || 0;
  const isNegativeVote = userVote < 0;

  const topThreeRankStyles: { [key: number]: string } = {
    1: "tw-text-[#D9A962]",
    2: "tw-text-[#C0C0C0]",
    3: "tw-text-[#B87333]",
  };

  const rankStyle =
    drop.rank && drop.rank <= 3
      ? topThreeRankStyles[drop.rank]
      : "tw-text-iron-300";
  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;

  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <div className="tw-px-4 tw-py-1.5 md:tw-py-1 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span className="tw-text-xs md:tw-text-sm tw-font-normal tw-text-iron-400">
            {formatNumberWithCommas(drop.raters_count)} {votersCountLabel}
          </span>
          <div className="tw-size-1 tw-bg-iron-700 tw-rounded-full"></div>
          <span className={`tw-text-xs md:tw-text-sm tw-font-normal ${rankStyle}`}>
            {formatNumberWithCommas(drop.rating)}{" "}
            <span className="tw-text-iron-400"> TDH</span>
          </span>
        </div>
      </div>
      {hasUserVoted && (
        <div className="tw-px-3 tw-py-1.5 md:tw-py-1 tw-rounded-xl tw-bg-iron-900/80 tw-ring-1 tw-ring-iron-700/50">
          <div className="tw-flex tw-items-center tw-gap-1.5">
            <span className="tw-text-xs md:tw-text-sm tw-font-medium">
              <span className="tw-text-iron-400">Your vote: </span>
              <span
                className={`${rankStyle} ${isNegativeVote && "tw-opacity-60"}`}
              >
                {formatNumberWithCommas(userVote)} TDH
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
