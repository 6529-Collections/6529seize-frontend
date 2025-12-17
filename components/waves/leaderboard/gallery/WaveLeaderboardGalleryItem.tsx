"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import WaveLeaderboardGalleryItemVotes from "./WaveLeaderboardGalleryItemVotes";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { VotingModal, MobileVotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { WAVE_VOTING_LABELS, WAVE_VOTE_STATS_LABELS } from "@/helpers/waves/waves.constants";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

interface WaveLeaderboardGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly artFocused?: boolean;
  readonly activeSort?: WaveDropsLeaderboardSort;
  readonly animationKey?: number;
}

export const WaveLeaderboardGalleryItem = memo<WaveLeaderboardGalleryItemProps>(
  ({ drop, onDropClick, artFocused = true, activeSort, animationKey = 0 }) => {
    const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
    const [isHighlighting, setIsHighlighting] = useState(false);
    const isMobileScreen = useIsMobileScreen();
    const { hasTouchScreen } = useDeviceInfo();
    const { canShowVote } = useDropInteractionRules(drop);

    const isFirstRenderRef = useRef(true);
    const previousSortRef = useRef(activeSort);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (hasTouchScreen) {
        return;
      }

      const sortChanged = previousSortRef.current !== activeSort;
      const shouldAnimate =
        (isFirstRenderRef.current && animationKey > 0) ||
        (!isFirstRenderRef.current && sortChanged);

      isFirstRenderRef.current = false;
      previousSortRef.current = activeSort;

      if (!shouldAnimate) {
        return;
      }

      setIsHighlighting(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsHighlighting(false);
      }, 700);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [activeSort, animationKey, hasTouchScreen]);

    const hasUserVoted = drop.context_profile_context?.rating !== undefined;

    const userVote = drop.context_profile_context?.rating ?? 0;
    const isNegativeVote = userVote < 0;

    const getVoteStyle = (
      isNegative: boolean,
      isZero: boolean,
      artFocused: boolean
    ) => {
      if (artFocused) {
        if (isZero) return "tw-text-iron-400";
        return isNegative ? "tw-text-iron-400" : "tw-text-iron-300";
      }
      if (isZero) return "tw-text-iron-400";
      return isNegative ? "tw-text-rose-500" : "tw-text-emerald-500";
    };

    const isZeroVote = userVote === 0;
    const voteStyle = getVoteStyle(isNegativeVote, isZeroVote, artFocused);

    const votingCreditType = drop.wave.voting_credit_type as ApiWaveCreditType;
    const votingCreditLabel = WAVE_VOTING_LABELS[votingCreditType] ?? votingCreditType;

    const handleImageClick = () => {
      onDropClick(drop);
    };

    const handleVoteButtonClick = () => {
      setIsVotingModalOpen(true);
    };

    const transitionClasses = !hasTouchScreen ? "tw-transition-all tw-duration-300 tw-ease-out" : "";
    const groupClasses = artFocused ? `tw-group ${transitionClasses}` : "";
    const containerClass = `${groupClasses} tw-relative tw-bg-iron-950/50 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg desktop-hover:hover:tw-border-iron-700 tw-shadow-lg desktop-hover:hover:tw-shadow-xl`;

    const highlightAnimation =
      isHighlighting && !hasTouchScreen ? "tw-animate-gallery-reveal" : "";

    const baseImageClasses = "tw-aspect-square tw-relative tw-cursor-pointer tw-touch-none tw-overflow-hidden tw-bg-iron-900 tw-group/image";

    const imageScaleClasses = hasTouchScreen
      ? ""
      : `tw-transform tw-duration-700 tw-ease-out group-hover/image:tw-scale-105 ${highlightAnimation}`;

    const imageContainerClass = baseImageClasses;

    return (
      <div className={containerClass}>
        <button
          className={`${imageContainerClass} tw-border-none tw-m-0 tw-p-0 tw-overflow-hidden tw-rounded-lg tw-w-full tw-text-left tw-bg-transparent`}
          onClick={handleImageClick}
          type="button"
        >
          <div className={`tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center ${imageScaleClasses}`}>
            <MediaDisplay
              media_mime_type={drop.parts[0].media[0].mime_type || "image/jpeg"}
              media_url={drop.parts[0].media[0].url}
              disableMediaInteraction={true}
            />
          </div>
        </button>
        <div className="tw-p-3 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800 tw-bg-iron-950/50 tw-rounded-b-lg">
          <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
            <div className="tw-min-w-0 tw-flex-1 tw-mr-2">
              {drop.title && (
                <h3 className="tw-mb-0 tw-text-sm tw-font-bold tw-text-iron-100 tw-truncate tw-leading-tight">
                  {drop.title}
                </h3>
              )}
              {drop.author?.handle && (
                <UserProfileTooltipWrapper
                  user={drop.author.handle ?? drop.author.id}
                >
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/${drop.author?.handle}`}
                    className="tw-text-xs tw-text-iron-400 tw-mt-0.5 tw-no-underline desktop-hover:hover:tw-underline desktop-hover:hover:tw-text-iron-300 tw-transition-colors tw-duration-150"
                  >
                    {drop.author?.handle}
                  </Link>
                </UserProfileTooltipWrapper>
              )}
            </div>
            {drop.rank !== undefined && (
              <WinnerDropBadge
                rank={drop.rank}
                decisionTime={drop.winning_context?.decision_time || null}
              />
            )}
          </div>
          <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-mb-3">
            <WaveLeaderboardGalleryItemVotes
              drop={drop}
              variant={artFocused ? "subtle" : "default"}
            />
            <div className="tw-flex tw-items-center tw-text-iron-500 tw-gap-1 tw-ml-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="tw-size-3 tw-flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              <span className="tw-font-medium">
                {formatNumberWithCommas(drop.raters_count)}
              </span>
            </div>
          </div>
          <div className="tw-flex tw-gap-3 tw-items-center tw-pt-2 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-800/50">
            {hasUserVoted && (
              <span className="tw-text-[11px] tw-text-iron-500 tw-font-mono">
                {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}: <span className={voteStyle}>{isNegativeVote && "-"}{formatNumberWithCommas(Math.abs(userVote))} {votingCreditLabel}</span>
              </span>
            )}
            {canShowVote && (
              <div className="tw-flex-1 tw-flex tw-justify-end">
                <VotingModalButton
                  drop={drop}
                  onClick={handleVoteButtonClick}
                  variant={artFocused ? "subtle" : "default"}
                />
              </div>
            )}
          </div>
        </div>

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
  }
);

WaveLeaderboardGalleryItem.displayName = "WaveLeaderboardGalleryItem";
