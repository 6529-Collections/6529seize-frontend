import React, { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import MediaDisplay from "../../../drops/view/item/content/media/MediaDisplay";
import WaveLeaderboardGalleryItemVotes from "./WaveLeaderboardGalleryItemVotes";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Link from "next/link";
import WinnerDropBadge from "../../drops/winner/WinnerDropBadge";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { VotingModal, MobileVotingModal } from "../../../../components/voting";
import VotingModalButton from "../../../../components/voting/VotingModalButton";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";

interface WaveLeaderboardGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly artFocused?: boolean; // New prop to activate art-focused mode
}

export const WaveLeaderboardGalleryItem: React.FC<
  WaveLeaderboardGalleryItemProps
> = ({ drop, onDropClick, artFocused = true }) => {
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const isMobileScreen = useIsMobileScreen();
  const { canShowVote } = useDropInteractionRules(drop);

  // Consider the user has voted even if the rating is 0
  const hasUserVoted = drop.context_profile_context?.rating !== undefined;

  const userVote = drop.context_profile_context?.rating ?? 0;
  const isNegativeVote = userVote < 0;

  const getVoteStyle = (
    isNegative: boolean,
    isZero: boolean,
    artFocused: boolean
  ) => {
    if (artFocused) {
      // Subtle styling for art-focused mode
      if (isZero) return "tw-text-iron-400";
      return isNegative ? "tw-text-iron-400" : "tw-text-iron-300";
    }
    // Original styling
    if (isZero) return "tw-text-iron-400";
    return isNegative ? "tw-text-rose-500" : "tw-text-emerald-500";
  };

  const isZeroVote = userVote === 0;
  const voteStyle = getVoteStyle(isNegativeVote, isZeroVote, artFocused);

  const handleImageClick = (e?: React.MouseEvent) => {
    onDropClick(drop);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      onDropClick(drop);
    }
  };

  const handleVoteButtonClick = () => {
    setIsVotingModalOpen(true);
  };

  // Determine container class based on art-focused mode
  const containerClass = artFocused
    ? "group tw-transition-all tw-duration-300 tw-ease-out active:tw-bg-iron-900 tw-transition tw-duration-200 tw-ease-out"
    : "";

  // Apply enhanced image effects for art-focused mode
  const imageContainerClass = artFocused
    ? "tw-ml-0.5 tw-aspect-square tw-bg-iron-900 tw-border tw-border-iron-800 tw-overflow-hidden tw-relative tw-cursor-pointer desktop-hover:hover:tw-border-iron-700 tw-transform tw-duration-300 tw-ease-out touch-none tw-ring-0 desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-iron-600"
    : "tw-aspect-square tw-bg-iron-800 tw-border tw-border-iron-800 tw-overflow-hidden tw-relative tw-cursor-pointer desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-scale-[1.02] tw-transform tw-duration-300 tw-ease-out touch-none";

  return (
    <div className={containerClass}>
      <button
        className={`${imageContainerClass} tw-border-none tw-m-0 tw-p-0 tw-w-full tw-text-left tw-bg-transparent`}
        onClick={handleImageClick}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
          <MediaDisplay
            media_mime_type={drop.parts[0].media[0].mime_type || "image/jpeg"}
            media_url={getScaledImageUri(
              drop.parts[0].media[0].url,
              ImageScale.AUTOx450
            )}
            disableMediaInteraction={true}
          />
        </div>
      </button>
      <div className="tw-flex tw-flex-col tw-mt-2 tw-gap-y-2">
        <div className="tw-flex tw-items-center tw-justify-between">
          {/* Rank badge aligned to the left */}
          <div>
            {drop.rank !== undefined ? (
              <WinnerDropBadge
                rank={drop.rank}
                decisionTime={drop.winning_context?.decision_time || null}
              />
            ) : (
              <div className="tw-w-4"></div>
            )}{" "}
            {/* Empty space if no rank */}
          </div>

          {/* Author name aligned to the right */}
          <div className="tw-flex tw-items-center">
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/${drop.author?.handle}`}
              className="tw-text-sm tw-truncate tw-no-underline tw-font-medium tw-text-iron-200"
            >
              {drop.author?.handle || " "}
            </Link>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
          {/* Pass variant prop based on art-focused mode */}
          <WaveLeaderboardGalleryItemVotes
            drop={drop}
            variant={artFocused ? "subtle" : "default"}
          />

          <div className="tw-flex tw-items-center tw-gap-x-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.25"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-size-4 tw-flex-shrink-0 tw-text-iron-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
            <span className="tw-text-sm tw-font-medium tw-text-iron-500">
              {formatNumberWithCommas(drop.raters_count)}
            </span>
          </div>
        </div>

        {/* Bottom row: User's vote and vote button */}
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            {hasUserVoted && (
              <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-rounded">
                <div className="tw-flex tw-items-baseline tw-gap-x-1">
                  <span className="tw-text-xs tw-font-medium tw-text-iron-500">
                    Your vote:
                  </span>
                  <span className={`tw-text-xs tw-font-semibold ${voteStyle}`}>
                    {isNegativeVote && "-"}
                    {formatNumberWithCommas(Math.abs(userVote))}{" "}
                    <span className="tw-text-iron-500">
                      {drop.wave.voting_credit_type}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
          {canShowVote && (
            <button
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              type="button"
              className="tw-border-none tw-m-0 tw-p-0 tw-bg-transparent"
            >
              <VotingModalButton
                drop={drop}
                onClick={handleVoteButtonClick}
                variant={artFocused ? "subtle" : "default"}
              />
            </button>
          )}
        </div>
      </div>

      {/* Voting modal */}
      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
        />
      )}
    </div>
  );
};
