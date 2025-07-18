import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { Tooltip } from "react-tooltip";
import Link from "next/link";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";
import DropVoteProgressing from "../../../../drops/view/utils/DropVoteProgressing";

interface WaveLeaderboardDropRatersProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropRaters: React.FC<
  WaveLeaderboardDropRatersProps
> = ({ drop }) => {
  const votersCountLabel = drop.raters_count === 1 ? "voter" : "voters";
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isNegativeVote = userVote < 0;

  const topThreeRankStyles: { [key: number]: string } = {
    1: "tw-text-[#E8D48A]",
    2: "tw-text-[#DDDDDD]",
    3: "tw-text-[#CD7F32]",
  };

  const getRankStyle = () => {
    if (drop.rank && drop.rank <= 3) {
      return topThreeRankStyles[drop.rank];
    }
    if (isNegativeVote) {
      return "tw-bg-gradient-to-r tw-from-red tw-to-red tw-bg-clip-text tw-text-transparent";
    }
    return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
  };

  const rankStyle = getRankStyle();

  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;

  return (
    <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-4 tw-gap-y-2 sm:tw-justify-end">
      <div className="tw-flex tw-items-baseline tw-gap-x-1">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1">
          {" "}
          <span className={`tw-text-sm tw-font-semibold ${rankStyle}`}>
            {formatNumberWithCommas(drop.rating)}
          </span>
          <DropVoteProgressing
            current={drop.rating}
            projected={drop.rating_prediction}
          />
        </div>
        <span className="tw-text-iron-400 tw-text-sm tw-whitespace-nowrap">
          {drop.wave.voting_credit_type} total
        </span>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap">
        <div className="tw-flex -tw-space-x-1.5 tw-items-center">
          {drop.top_raters.map((voter, index) => (
            <>
              <div
                key={voter.profile.id}
                className="tw-relative tw-transition-transform hover:tw-scale-110 hover:tw-z-10"
                style={{ zIndex: drop.top_raters.length - index }}
                data-tooltip-id={`voter-${drop.id}-${voter.profile.id}`}
              >
                <Link href={`/${voter.profile.handle}`}>
                  {voter.profile.pfp ? (
                    <img
                      src={getScaledImageUri(
                        voter.profile.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt={`${voter.profile.handle}'s Profile`}
                      className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-800 tw-object-contain"
                    />
                  ) : (
                    <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-800" />
                  )}
                </Link>
              </div>
              <Tooltip
                id={`voter-${drop.id}-${voter.profile.id}`}
                delayShow={0}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                  zIndex: 1000,
                }}
              >
                <span className="tw-text-sm tw-font-medium">
                  {voter.profile.handle} •{" "}
                  {formatNumberWithCommas(voter.rating)}{" "}
                  {drop.wave.voting_credit_type}
                </span>
              </Tooltip>
            </>
          ))}
        </div>
        <span className="tw-text-sm tw-text-iron-400">
          {formatNumberWithCommas(drop.raters_count)} {votersCountLabel}
        </span>
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-text-sm tw-whitespace-nowrap">
            <span className="tw-text-iron-400">Your vote: </span>
            <span className={`tw-font-semibold ${rankStyle}`}>
              {formatNumberWithCommas(userVote)} {drop.wave.voting_credit_type}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
