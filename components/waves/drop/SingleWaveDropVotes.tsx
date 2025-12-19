"use client";

import React from "react";
import { ApiDrop } from "@/generated/models/ObjectSerializer";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Tooltip } from "react-tooltip";
import Link from "next/link";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import Image from "next/image";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface SingleWaveDropVotesProps {
  readonly drop: ApiDrop;
  readonly showVotersBorder?: boolean;
}

export const SingleWaveDropVotes: React.FC<SingleWaveDropVotesProps> = ({
  drop,
  showVotersBorder = false,
}) => {
  const { isVotingEnded, isWinner } = useDropInteractionRules(drop);
  const topVoters = drop.top_raters.slice(0, 3);
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

      <div
        className={`tw-flex tw-items-center tw-gap-3 ${
          showVotersBorder
            ? "tw-pt-4 lg:tw-pt-6 tw-mt-3 lg:mt-4 tw-border-t tw-border-solid tw-border-white/10 tw-border-x-0 tw-border-b-0"
            : ""
        }`}
      >
        <div className="tw-flex tw-items-center -tw-space-x-2">
          {topVoters.map((voter) => (
            <div key={voter.profile.handle}>
              <Link href={`/${voter.profile.handle}`}>
                {voter.profile.pfp ? (
                  <div className="tw-relative tw-w-6 tw-h-6 lg:tw-w-7 lg:tw-h-7">
                    <Image
                      className="tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                      src={resolveIpfsUrlSync(voter.profile.pfp)}
                      alt="Recent voter"
                      fill
                      sizes="24px"
                      data-tooltip-id={`wave-voter-${voter.profile.handle}`}
                    />
                  </div>
                ) : (
                  <div
                    className="tw-w-6 tw-h-6 lg:tw-w-7 lg:tw-h-7 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800"
                    data-tooltip-id={`wave-voter-${voter.profile.handle}`}
                  />
                )}
              </Link>
              <Tooltip
                id={`wave-voter-${voter.profile.handle}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                {voter.profile.handle} - {formatNumberWithCommas(voter.rating)}
              </Tooltip>
            </div>
          ))}
        </div>
        <span className="tw-text-iron-500 tw-font-normal tw-text-sm">
          {formatNumberWithCommas(drop.raters_count)}{" "}
          <span className="tw-text-iron-500 tw-font-normal">
            {drop.raters_count === 1 ? "voter" : "voters"}
          </span>
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
