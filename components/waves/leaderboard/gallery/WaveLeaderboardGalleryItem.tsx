"use client";

import React, { useState, useEffect, memo } from "react";
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

interface WaveLeaderboardGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly artFocused?: boolean; // New prop to activate art-focused mode
  readonly activeSort?: WaveDropsLeaderboardSort;
  readonly animationKey?: number;
}

export const WaveLeaderboardGalleryItem = memo<WaveLeaderboardGalleryItemProps>(
  ({ drop, onDropClick, artFocused = true, activeSort, animationKey = 0 }) => {
    const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
    const [isHighlighting, setIsHighlighting] = useState(false);
    const isMobileScreen = useIsMobileScreen();
    const { hasTouchScreen } = useDeviceInfo(); // Detect touch devices
    const { canShowVote } = useDropInteractionRules(drop);

    // Animation state and useEffect - ONLY for desktop (non-touch) devices
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [previousSort, setPreviousSort] = useState(activeSort);

    useEffect(() => {
      // Skip all animations on touch devices for performance
      if (hasTouchScreen) {
        return;
      }

      let timer: NodeJS.Timeout | null = null;

      // Skip animation on first render unless animationKey is set
      if (isFirstRender) {
        setIsFirstRender(false);
        setPreviousSort(activeSort);

        // Animate on mount if animationKey is set (indicating a sort change)
        if (animationKey > 0) {
          setIsHighlighting(true);
          timer = setTimeout(() => {
            setIsHighlighting(false);
          }, 700);
        }
      } else if (previousSort !== activeSort) {
        // Only animate if sort actually changed
        setPreviousSort(activeSort);
        setIsHighlighting(true);
        timer = setTimeout(() => {
          setIsHighlighting(false);
        }, 700);
      }

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [activeSort, animationKey, isFirstRender, previousSort, hasTouchScreen]);

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

    const handleImageClick = () => {
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

    // Determine container class based on art-focused mode and highlighting state
    const transitionClasses = !hasTouchScreen ? "tw-transition-all tw-duration-300 tw-ease-out" : "";
    const groupClasses = artFocused ? `group ${transitionClasses}` : "";
    const containerClass = `${groupClasses} tw-relative tw-rounded-lg`;

    // Apply image effects with animation when highlighting - ONLY on desktop
    const highlightAnimation =
      isHighlighting && !hasTouchScreen ? "tw-animate-gallery-reveal" : "";

    const baseImageClasses = "tw-aspect-square tw-border tw-border-iron-800 tw-relative tw-cursor-pointer touch-none";
    
    const artFocusedHoverClasses = !hasTouchScreen 
      ? `desktop-hover:hover:tw-border-iron-700 tw-transform tw-duration-300 tw-ease-out tw-ring-0 desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-iron-600 ${highlightAnimation}`
      : "";
    
    const defaultHoverClasses = !hasTouchScreen
      ? `desktop-hover:hover:-tw-translate-y-0.5 desktop-hover:hover:tw-scale-[1.02] tw-transform tw-duration-300 tw-ease-out ${highlightAnimation}`
      : "";

    const imageContainerClass = artFocused
      ? `tw-ml-0.5 ${baseImageClasses} tw-bg-iron-900 ${artFocusedHoverClasses}`
      : `${baseImageClasses} tw-bg-iron-800 ${defaultHoverClasses}`;

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
              media_url={drop.parts[0].media[0].url}
              disableMediaInteraction={true}
            />
          </div>
        </button>
        <div className="tw-flex tw-flex-col tw-mt-2.5 tw-gap-y-1.5">
          {/* Rank + Projected votes */}
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2">
            {drop.rank !== undefined && (
              <WinnerDropBadge
                rank={drop.rank}
                decisionTime={drop.winning_context?.decision_time || null}
              />
            )}
            <WaveLeaderboardGalleryItemVotes
              drop={drop}
              variant={artFocused ? "subtle" : "default"}
            />
          </div>
          {/* Art title */}
          {drop.title && (
            <p className="tw-mb-0 tw-text-[13px] tw-font-medium tw-text-iron-50 tw-truncate tw-leading-snug">
              {drop.title}
            </p>
          )}
          {/* Author */}
          {drop.author?.handle && (
            <UserProfileTooltipWrapper
              user={drop.author.handle ?? drop.author.id}
            >
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${drop.author?.handle}`}
                className="tw-text-xs tw-truncate tw-no-underline tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline tw-transition-colors tw-duration-150"
              >
                {drop.author?.handle}
              </Link>
            </UserProfileTooltipWrapper>
          )}
          {/* Voters count + Your vote + Vote button */}
          <div className="tw-flex tw-items-center tw-justify-between tw-pt-1">
            <div className="tw-flex tw-items-center tw-gap-x-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="tw-size-3.5 tw-flex-shrink-0 tw-text-iron-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                {formatNumberWithCommas(drop.raters_count)}
              </span>
            </div>
            <div className="tw-flex tw-items-center tw-gap-x-2.5">
              {hasUserVoted && (
                <span className={`tw-text-xs ${voteStyle}`}>
                  You: {isNegativeVote && "-"}{formatNumberWithCommas(Math.abs(userVote))} {drop.wave.voting_credit_type}
                </span>
              )}
              {canShowVote && (
                <VotingModalButton
                  drop={drop}
                  onClick={handleVoteButtonClick}
                  variant={artFocused ? "subtle" : "default"}
                />
              )}
            </div>
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
  },
  (prevProps, nextProps) => {
    // Force re-render when activeSort or animationKey changes
    if (
      prevProps.activeSort !== nextProps.activeSort ||
      prevProps.animationKey !== nextProps.animationKey
    ) {
      return false;
    }

    // Otherwise, use shallow comparison for other props
    return (
      prevProps.drop.id === nextProps.drop.id &&
      prevProps.onDropClick === nextProps.onDropClick &&
      prevProps.artFocused === nextProps.artFocused
    );
  }
);

WaveLeaderboardGalleryItem.displayName = "WaveLeaderboardGalleryItem";
