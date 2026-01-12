"use client";

import { memo, useCallback } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { DropContentSmall } from "./drops/DropContentSmall";
import { WaveWinnersSmallOutcome } from "./WaveWinnersSmallOutcome";
import WinnerDropBadge from "../drops/winner/WinnerDropBadge";
import WaveDropTime from "../drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";

interface MemesWaveWinnerDropSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
  readonly rank?: number | undefined; // For explicitly setting rank from decision winners
}

export const MemesWaveWinnerDropSmall = memo<MemesWaveWinnerDropSmallProps>(
  ({ drop, onDropClick, rank }) => {
    // Use provided rank or fall back to drop.rank
    const effectiveRank = rank ?? drop.rank;

    const hasUserVoted =
      drop.context_profile_context?.rating !== undefined &&
      drop.context_profile_context?.rating !== 0;

    const userVote = drop.context_profile_context?.rating ?? 0;
    const isNegativeVote = userVote < 0;

    const getRatingStyle = () => {
      if (drop.rating >= 0) {
        return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
      }

      return "tw-bg-gradient-to-r tw-from-rose-400 tw-to-rose-500 tw-bg-clip-text tw-text-transparent";
    };

    const ratingStyle = getRatingStyle();

    const getUserVoteStyle = () => {
      if (isNegativeVote) {
        return "tw-bg-gradient-to-r tw-from-rose-400 tw-to-rose-500 tw-bg-clip-text tw-text-transparent";
      }

      return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
    };

    const userVoteStyle = getUserVoteStyle();

    const votingLabel =
      WAVE_VOTING_LABELS[drop.wave.voting_credit_type] ??
      drop.wave.voting_credit_type ??
      "";

    const handleDropClick = useCallback(() => {
      onDropClick();
    }, [onDropClick]);

    return (
      <div
        onClick={handleDropClick}
        className="tw-group tw-w-full tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-text-left"
      >
        <div className="tw-relative tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-800/80">
          <div className="tw-relative tw-flex tw-flex-col">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4">
              <div className="tw-flex tw-items-center tw-gap-x-3">
                {effectiveRank && (
                  <div>
                    <WinnerDropBadge
                      rank={effectiveRank}
                      // Not passing decisionTime to keep the badge compact
                      decisionTime={null}
                    />
                  </div>
                )}
              </div>

              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-3">
                <div className="tw-flex tw-items-center tw-gap-x-1.5">
                  <span
                    className={`tw-text-sm tw-font-semibold ${ratingStyle}`}
                  >
                    {formatNumberWithCommas(drop.rating)}
                  </span>
                  <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                    {votingLabel}
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-x-1.5">
                  <span className="tw-text-sm tw-text-iron-200">
                    {formatNumberWithCommas(drop.raters_count)}
                  </span>
                  <span className="tw-text-sm tw-text-iron-400">
                    {drop.raters_count === 1 ? "voter" : "voters"}
                  </span>
                </div>

                {hasUserVoted && (
                  <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap">
                    <span className="tw-text-sm tw-text-iron-400">You:</span>
                    <span
                      className={`tw-text-sm tw-font-medium ${userVoteStyle}`}
                    >
                      {formatNumberWithCommas(userVote)} {votingLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-x-3">
            <Link
              href={`/${drop.author.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-block tw-flex-shrink-0 tw-transition-opacity desktop-hover:group-hover:tw-opacity-90"
            >
              {drop.author.pfp ? (
                <img
                  src={getScaledImageUri(
                    drop.author.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={`${drop.author.handle}'s profile`}
                  className="tw-size-7 tw-rounded-lg tw-object-cover tw-ring-1 tw-ring-white/10"
                />
              ) : (
                <div className="tw-size-7 tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
              )}
            </Link>

            <div className="tw-flex tw-items-center tw-gap-1.5">
              <UserProfileTooltipWrapper
                user={drop.author.handle ?? drop.author.id}
              >
                <Link
                  href={`/${drop.author.handle}`}
                  onClick={(e) => e.stopPropagation()}
                  className="tw-truncate tw-no-underline desktop-hover:hover:tw-underline"
                >
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors desktop-hover:hover:tw-text-opacity-80">
                    {drop.author.handle}
                  </span>
                </Link>
              </UserProfileTooltipWrapper>
              <span className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></span>
              <WaveDropTime timestamp={drop.created_at} />
            </div>
          </div>

          <div className="tw-ml-10">
            <DropContentSmall drop={drop} onDropClick={onDropClick} />
            <div className="tw-relative tw-mt-2">
              <WaveWinnersSmallOutcome drop={drop} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MemesWaveWinnerDropSmall.displayName = "MemesWaveWinnerDropSmall";
