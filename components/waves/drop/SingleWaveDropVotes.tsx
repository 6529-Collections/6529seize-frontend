"use client";

import React from "react";
import { ApiDrop } from "@/generated/models/ObjectSerializer";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface SingleWaveDropVotesProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropVotes: React.FC<SingleWaveDropVotesProps> = ({
  drop,
}) => {
  const { isVotingEnded, isWinner } = useDropInteractionRules(drop);
  const isPositive = drop.rating >= 0;

  // Check if user has voted
  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;

  // Only show user vote when voting has ended or it's a winner drop
  const shouldShowUserVote = (isVotingEnded || isWinner) && hasUserVoted;

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-mt-1">
      <div className="tw-flex tw-items-baseline tw-gap-x-2">
        <span
          className={`tw-text-sm tw-font-bold tw-font-mono tw-tracking-tight ${
            isPositive ? "tw-text-emerald-600" : "tw-text-rose-600"
          }`}
        >
          {formatNumberWithCommas(drop.rating)}
        </span>
        <DropVoteProgressing
          current={drop.rating}
          projected={drop.rating_prediction}
        />
        <span className="tw-text-sm tw-text-iron-500 tw-font-normal">
          {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}{" "}
          {WAVE_VOTE_STATS_LABELS.TOTAL}
        </span>
      </div>

      {/* User's vote - only show when voting is ended or it's a winner drop */}
      {shouldShowUserVote && (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-flex tw-items-baseline tw-gap-x-1">
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
            </span>
            <span
              className={`tw-text-sm tw-font-semibold ${
                isUserVoteNegative ? "tw-text-rose-600" : "tw-text-emerald-600"
              }`}
            >
              {isUserVoteNegative && "-"}
              {formatNumberWithCommas(Math.abs(userVote))}{" "}
              <span className="tw-text-iron-400 tw-font-normal">
                {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
