import React, { useState, useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import WaveDropMobileMenu from "../../waves/drops/WaveDropMobileMenu";
import WaveDropActions from "../../waves/drops/WaveDropActions";
import Link from "next/link";
import Tippy from "@tippyjs/react";
import {
  cicToType,
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";
import WaveDropAuthorPfp from "../../waves/drops/WaveDropAuthorPfp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faImage, faTrophy } from "@fortawesome/free-solid-svg-icons";

interface MemeWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

/**
 * Special version of WinnerDrop for the Memes wave
 * This component features a 2-column layout with artwork on the right
 */
export default function MemeWinnerDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  dropViewDropId,
  onReply,
  onQuote,
  onQuoteClick,
  onDropContentClick,
  parentContainerRef,
}: MemeWinnerDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.key === "title")?.value || "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.key === "description")?.value ||
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia =
    drop.media && drop.media.length > 0 ? drop.media[0].url : null;

  // Get winner info
  const effectiveRank = drop.winning_context?.place ?? drop.rank;
  const decisionTime = drop.winning_context?.decision_time;

  // Get top voters for votes display
  const firstThreeVoters = drop.top_raters?.slice(0, 3) || [];
  const isPositive = (drop.rating || 0) >= 0;

  // Border styling based on rank
  const getBorderClasses = () => {
    const rank = effectiveRank && effectiveRank <= 3 ? effectiveRank : null;

    const baseClasses =
      "tw-rounded-xl tw-border tw-border-solid tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

    if (isActiveDrop) {
      return `${baseClasses} tw-border-[#3CCB7F]/30 tw-bg-[#3CCB7F]/5`;
    } else if (rank === 1) {
      return `${baseClasses} tw-border-[#fbbf24]/30`;
    } else if (rank === 2) {
      return `${baseClasses} tw-border-[#94a3b8]/30`;
    } else if (rank === 3) {
      return `${baseClasses} tw-border-[#CD7F32]/30`;
    } else {
      return `${baseClasses} tw-border-iron-800/50`;
    }
  };

  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onReply, drop, activePartIndex]);

  const handleOnQuote = useCallback(() => {
    setIsSlideUp(false);
    onQuote({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onQuote, drop, activePartIndex]);

  const handleViewLarger = () => {
    if (onDropContentClick) {
      onDropContentClick(drop);
    }
  };

  return (
    <div className="tw-w-full">
      <div
        className={`tw-w-full ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        }`}
      >
        <div className={`${getBorderClasses()} tw-bg-iron-950`}>
          {drop.reply_to && drop.reply_to.drop_id !== dropViewDropId && (
            <div className="tw-px-5 tw-pt-3 tw-pb-0">
              <Link
                href={`/my-stream?wave=${drop.wave.id}&drop=${drop.reply_to.drop_id}`}
                className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400 hover:tw-text-primary-400 tw-no-underline tw-transition-colors"
              >
                <svg
                  className="tw-w-4 tw-h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 9L9 15M15 15L9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>In reply to a post</span>
              </Link>
            </div>
          )}

          {/* Two-column layout */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-12 tw-gap-5">
            {/* Left column - Metadata */}
            <div className="tw-col-span-1 md:tw-col-span-5 tw-p-5">
              {/* Header with metadata */}
              <div className="tw-flex tw-flex-col tw-gap-4">
                {/* Rank and title in the same row */}
                <div className="tw-flex tw-items-center tw-justify-start tw-gap-3">
                  <WinnerDropBadge
                    rank={effectiveRank}
                    decisionTime={decisionTime}
                  />
                  <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
                    {title}
                  </h3>
                </div>

                {/* Description on its own row */}
                <div>
                  <p className="tw-text-iron-300 tw-mb-0">{description}</p>
                </div>

                {/* Vote count and artist info on the last row */}
                <div className="tw-flex tw-flex-col tw-gap-4">
                  {/* Vote count */}
                  <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
                    <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
                      <span
                        className={`tw-text-xl tw-font-semibold tw-bg-gradient-to-r ${
                          isPositive
                            ? "tw-from-emerald-400 tw-to-emerald-500"
                            : "tw-from-rose-400 tw-to-rose-500"
                        } tw-bg-clip-text tw-text-transparent`}
                      >
                        {formatNumberWithCommas(drop.rating || 0)}
                      </span>
                      <span className="tw-text-sm tw-text-iron-400">
                        {drop.wave.voting_credit_type} total
                      </span>
                    </div>
                    <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-x-3">
                      <div className="tw-flex tw-items-center -tw-space-x-1.5">
                        {firstThreeVoters.map((voter) => (
                          <Tippy
                            key={voter.profile.handle}
                            content={`${
                              voter.profile.handle
                            } - ${formatNumberWithCommas(voter.rating)}`}
                          >
                            <Link
                              href={`/${voter.profile.handle}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {voter.profile.pfp ? (
                                <img
                                  className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950"
                                  src={voter.profile.pfp}
                                  alt="Recent voter"
                                />
                              ) : (
                                <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                              )}
                            </Link>
                          </Tippy>
                        ))}
                      </div>
                      <div className="tw-flex tw-items-baseline tw-gap-x-1">
                        <span className="tw-text-base tw-font-medium tw-text-iron-100">
                          {formatNumberWithCommas(drop.ratings_count || 0)}
                        </span>
                        <span className="tw-text-sm tw-text-iron-400">
                          {(drop.ratings_count || 0) === 1 ? "voter" : "voters"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Artist info with CIC and level */}
                  <div className="tw-flex tw-items-center tw-gap-x-2">
                    <Link
                      href={`/${drop.author?.handle}`}
                      onClick={(e) => e.stopPropagation()}
                      className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
                    >
                      <WaveDropAuthorPfp drop={drop} />
                    </Link>
                    <div className="tw-flex tw-items-center tw-gap-x-4">
                      <div className="tw-flex tw-items-center tw-gap-x-2">
                        {drop.author?.level && (
                          <UserCICAndLevel
                            level={drop.author.level}
                            cicType={cicToType(drop.author.cic)}
                            size={UserCICAndLevelSize.SMALL}
                          />
                        )}
                        <Link
                          href={`/${drop.author?.handle}`}
                          onClick={(e) => e.stopPropagation()}
                          className="tw-no-underline"
                        >
                          <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                            {drop.author?.handle}
                          </span>
                        </Link>

                        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>

                        <span className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                          {getTimeAgoShort(drop.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Winner callout */}
                  <div className="tw-p-4 tw-bg-gradient-to-r tw-from-green/20 tw-to-green/20 tw-border-l-2 tw-border-green-500 tw-rounded-lg tw-shadow-sm">
                    <p className="tw-text-green tw-text-sm tw-font-medium tw-mb-0">
                      Winner: This artwork has been selected as a winner in The
                      Memes collection
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Artwork */}
            <div
              className="tw-col-span-1 md:tw-col-span-7 tw-relative tw-bg-iron-900/30 tw-h-full tw-cursor-pointer"
              onClick={handleViewLarger}
            >
              <div className="tw-aspect-video tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-iron-900/50">
                {artworkMedia ? (
                  <img
                    src={artworkMedia}
                    alt={title}
                    className="tw-max-w-full tw-max-h-full tw-object-contain tw-cursor-pointer"
                  />
                ) : (
                  <div className="tw-text-center tw-text-iron-400 tw-px-6">
                    <FontAwesomeIcon
                      icon={faImage}
                      className="tw-w-14 tw-h-14 tw-mx-auto tw-mb-3 tw-text-iron-700"
                    />
                    <p className="tw-text-sm">Artwork preview</p>
                  </div>
                )}

                {/* View larger button */}
                <div className="tw-absolute tw-bottom-3 tw-right-3">
                  <button className="tw-flex tw-items-center tw-border-0 tw-gap-1.5 tw-bg-iron-950/80 tw-text-iron-300 tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium hover:tw-bg-iron-900">
                    <FontAwesomeIcon
                      icon={faExpand}
                      className="tw-size-3 tw-flex-shrink-0"
                    />
                    View larger
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions for desktop */}
          {!isMobile && showReplyAndQuote && (
            <WaveDropActions
              drop={drop}
              activePartIndex={activePartIndex}
              onReply={handleOnReply}
              onQuote={handleOnQuote}
            />
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <WaveDropMobileMenu
        drop={drop}
        isOpen={isSlideUp}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onQuote={handleOnQuote}
      />
    </div>
  );
}
