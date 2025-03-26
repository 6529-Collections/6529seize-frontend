import React, { memo, useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";
import { DropContentSmall } from "./drops/DropContentSmall";
import { WaveWinnersSmallOutcome } from "./WaveWinnersSmallOutcome";
import WinnerDropBadge from "../drops/winner/WinnerDropBadge";
import { Time } from "../../../helpers/time";

interface DefaultWaveWinnerDropSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
  readonly rank?: number; // For explicitly setting rank from decision winners
}

export const DefaultWaveWinnerDropSmall = memo<DefaultWaveWinnerDropSmallProps>(
  ({ drop, onDropClick, wave, rank }) => {
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

    const handleDropClick = useCallback(() => {
      onDropClick(drop);
    }, [drop, onDropClick]);

    return (
      <div
        onClick={handleDropClick}
        className="tw-w-full tw-text-left tw-cursor-pointer tw-group tw-rounded-xl tw-overflow-hidden desktop-hover:hover:tw-scale-[1.01] tw-transform tw-transition-all tw-duration-300 tw-ease-out"
      >
        <div className="tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-relative desktop-hover:hover:tw-bg-iron-800/60 tw-transition-all tw-duration-300 tw-ease-out">
          <div className="tw-flex tw-flex-col tw-relative">
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

              <div className="tw-flex tw-justify-end tw-items-center tw-gap-x-3 tw-flex-wrap">
                <div className="tw-flex tw-items-center tw-gap-x-1.5">
                  <span
                    className={`tw-text-sm tw-font-semibold ${ratingStyle}`}
                  >
                    {formatNumberWithCommas(drop.rating)}
                  </span>
                  <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                    {drop.wave.voting_credit_type}
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
                    <span className="tw-text-iron-400 tw-text-sm">You:</span>
                    <span
                      className={`tw-text-sm tw-font-medium ${userVoteStyle}`}
                    >
                      {formatNumberWithCommas(userVote)}{" "}
                      {drop.wave.voting_credit_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-x-3 tw-mt-4">
            <Link
              href={`/${drop.author.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-block tw-flex-shrink-0 desktop-hover:group-hover:tw-opacity-90 tw-transition-opacity"
            >
              {drop.author.pfp ? (
                <img
                  src={getScaledImageUri(
                    drop.author.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={`${drop.author.handle}'s profile`}
                  className="tw-size-7 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-object-cover"
                />
              ) : (
                <div className="tw-size-7 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800" />
              )}
            </Link>

            <div className="tw-flex tw-items-center tw-gap-1.5">
              <Link
                href={`/${drop.author.handle}`}
                onClick={(e) => e.stopPropagation()}
                className="tw-no-underline tw-truncate"
              >
                <span className="tw-text-sm tw-font-semibold tw-text-iron-200 desktop-hover:hover:tw-text-iron-100 tw-transition-colors">
                  {drop.author.handle}
                </span>
              </Link>
              <span className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></span>
              <span className="tw-text-xs tw-text-iron-400 tw-flex-shrink-0">
                {Time.millis(drop.created_at).toLocaleDropDateAndTimeString()}
              </span>
            </div>
          </div>

          <div className="tw-ml-10">
            <DropContentSmall drop={drop} onDropClick={onDropClick} />
            <div className="tw-mt-2 tw-relative">
              <WaveWinnersSmallOutcome drop={drop} wave={wave} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DefaultWaveWinnerDropSmall.displayName = "DefaultWaveWinnerDropSmall";
