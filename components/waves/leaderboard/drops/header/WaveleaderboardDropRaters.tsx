import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Tooltip } from "react-tooltip";
import Link from "next/link";
import Image from "next/image";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface WaveLeaderboardDropRatersProps {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
}

export const WaveLeaderboardDropRaters: React.FC<
  WaveLeaderboardDropRatersProps
> = ({ drop, winningThreshold }) => {
  const votersCountLabel = drop.raters_count === 1 ? "voter" : "voters";
  const totalVote = drop.rating;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const totalVoteClass = totalVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const userVoteClass = userVote < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const displayWinningThreshold =
    typeof winningThreshold === "number" && winningThreshold > 0
      ? winningThreshold
      : null;
  const hasWinningThreshold = displayWinningThreshold !== null;
  const hasReachedThreshold =
    displayWinningThreshold !== null && totalVote >= displayWinningThreshold;

  const hasUserVoted = userVote !== 0;

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 sm:tw-justify-end">
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
        <div className="tw-relative tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className={`tw-font-medium ${totalVoteClass}`}>
            {formatNumberWithCommas(totalVote)}
          </span>
          {displayWinningThreshold !== null && (
            <>
              <span className="tw-font-medium tw-text-iron-500">/</span>
              <span className="tw-font-medium tw-text-iron-50">
                {formatNumberWithCommas(displayWinningThreshold)}
              </span>
            </>
          )}
          <DropVoteProgressing
            current={drop.rating}
            projected={drop.rating_prediction}
            compact
          />
        </div>
        <span className="tw-whitespace-nowrap tw-font-normal tw-text-iron-400">
          {hasWinningThreshold ? (
            <>
              {votingLabel}{" "}
              <span
                className={
                  hasReachedThreshold ? "tw-text-emerald-400" : undefined
                }
              >
                {hasReachedThreshold ? "Approved" : "to approve"}
              </span>
            </>
          ) : (
            <>
              {votingLabel} {WAVE_VOTE_STATS_LABELS.TOTAL}
            </>
          )}
        </span>
      </div>

      <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-leading-5">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {drop.top_raters.map((voter, index) => {
            const voterLabel =
              voter.profile.handle ?? voter.profile.primary_address;
            const tooltipId = `voter-${drop.id}-${voter.profile.id}`;

            return (
              <React.Fragment key={voter.profile.id}>
                <div
                  className="tw-relative tw-transition-transform hover:tw-z-10 hover:tw-scale-110"
                  style={{ zIndex: drop.top_raters.length - index }}
                  data-tooltip-id={tooltipId}
                >
                  <Link href={`/${voterLabel}`}>
                    {voter.profile.pfp ? (
                      <Image
                        src={getScaledImageUri(
                          voter.profile.pfp,
                          ImageScale.W_AUTO_H_50
                        )}
                        alt={`${voterLabel}'s Profile`}
                        width={20}
                        height={20}
                        className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800 tw-object-contain tw-ring-1 tw-ring-black"
                      />
                    ) : (
                      <div className="tw-h-5 tw-w-5 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-black" />
                    )}
                  </Link>
                </div>
                <Tooltip
                  id={tooltipId}
                  place="top"
                  offset={8}
                  opacity={1}
                  positionStrategy="fixed"
                  delayShow={0}
                  style={TOOLTIP_STYLES}
                >
                  {voterLabel} • {formatNumberWithCommas(voter.rating)}{" "}
                  {votingLabel}
                </Tooltip>
              </React.Fragment>
            );
          })}
        </div>
        <span className="tw-text-iron-400">
          {formatNumberWithCommas(drop.raters_count)} {votersCountLabel}
        </span>
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-leading-5">
          <span className="tw-whitespace-nowrap">
            <span className="tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
            </span>
            <span className={`tw-font-medium ${userVoteClass}`}>
              {formatNumberWithCommas(userVote)} {votingLabel}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
