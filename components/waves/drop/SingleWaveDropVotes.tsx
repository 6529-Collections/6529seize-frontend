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

interface SingleWaveDropVotesProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropVotes: React.FC<SingleWaveDropVotesProps> = ({
  drop,
}) => {
  const { isVotingEnded, isWinner } = useDropInteractionRules(drop);
  const firstThreeVoters = drop.top_raters.slice(0, 3);
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
    <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-gap-x-6">
      <div className="tw-flex tw-items-baseline tw-gap-x-1">
        <span
          className={`tw-text-sm tw-font-semibold ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
          } `}
        >
          {formatNumberWithCommas(drop.rating)}
        </span>
        <DropVoteProgressing
          current={drop.rating}
          projected={drop.rating_prediction}
        />
        <span className="tw-text-sm tw-text-iron-400 text-nowrap">
          {drop.wave.voting_credit_type} total
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {firstThreeVoters.map((voter) => (
            <div key={voter.profile.handle}>
              <Link href={`/${voter.profile.handle}`}>
                {voter.profile.pfp ? (
                  <div className="tw-relative tw-size-6">
                    <Image
                      className="tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-object-cover"
                      src={resolveIpfsUrlSync(voter.profile.pfp)}
                      alt="Recent voter"
                      fill
                      sizes="24px"
                      data-tooltip-id={`wave-voter-${voter.profile.handle}`}
                    />
                  </div>
                ) : (
                  <div 
                    className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" 
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
        <div className="tw-flex tw-items-baseline tw-gap-x-1">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(drop.raters_count)}
          </span>
          <span className="tw-text-sm tw-text-iron-400 text-nowrap">
            {drop.raters_count === 1 ? "voter" : "voters"}
          </span>
        </div>
      </div>

      {/* User's vote - only show when voting is ended or it's a winner drop */}
      {shouldShowUserVote && (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-flex tw-items-baseline tw-gap-x-1">
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              Your vote:
            </span>
            <span
              className={`tw-text-sm tw-font-semibold ${
                isUserVoteNegative ? "tw-text-rose-500" : "tw-text-emerald-500"
              }`}
            >
              {isUserVoteNegative && "-"}
              {formatNumberWithCommas(Math.abs(userVote))}{" "}
              <span className="tw-text-iron-400 tw-font-normal">
                {drop.wave.voting_credit_type}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
