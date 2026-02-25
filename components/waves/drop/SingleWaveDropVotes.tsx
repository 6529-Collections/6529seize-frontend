"use client";

import React from "react";

import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import type { ApiDrop } from "@/generated/models/ObjectSerializer";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
    WAVE_VOTE_STATS_LABELS,
    WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

interface SingleWaveDropVotesProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropVotes: React.FC<SingleWaveDropVotesProps> = ({
  drop,
}) => {
  const { isVotingEnded, isWinner } = useDropInteractionRules(drop);
  const isPositive = drop.rating >= 0;

  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;

  const shouldShowUserVote = (isVotingEnded || isWinner) && hasUserVoted;

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-mt-1">
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
        <span
          className={`tw-text-sm tw-font-bold tw-tabular-nums tw-tracking-tight ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
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

      {shouldShowUserVote && (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-flex tw-items-baseline tw-gap-x-1">
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
            </span>
            <span
              className={`tw-text-sm tw-font-semibold ${
                isUserVoteNegative ? "tw-text-rose-500" : "tw-text-emerald-500"
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
