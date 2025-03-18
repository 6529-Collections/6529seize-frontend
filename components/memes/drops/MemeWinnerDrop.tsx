import React, { useState, useCallback } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../../waves/drops/Drop";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import useIsMobileDevice from "../../../hooks/isMobileDevice";
import WaveDropMobileMenu from "../../waves/drops/WaveDropMobileMenu";
import WaveDropActions from "../../waves/drops/WaveDropActions";
import Link from "next/link";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

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
  const title = drop.metadata?.find(m => m.key === "title")?.value || "Untitled Artwork";
  const description = drop.metadata?.find(m => m.key === "description")?.value || 
    "This is an artwork submission for The Memes collection.";
  const artistName = drop.profile?.name || "Anonymous Artist";
  
  // Get artwork media URL if available
  const artworkMedia = drop.media && drop.media.length > 0 ? drop.media[0].url : null;
  
  // Get winner info
  const effectiveRank = drop.winning_context?.place ?? drop.rank;
  const decisionTime = drop.winning_context?.decision_time;
  
  // Border styling based on rank
  const getBorderClasses = () => {
    const rank = effectiveRank && effectiveRank <= 3 ? effectiveRank : null;
    
    const baseClasses = "tw-rounded-xl tw-border tw-border-solid tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";
    
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
      <div className={`tw-w-full ${location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""}`}>
        <div className={`${getBorderClasses()} tw-bg-iron-950`}>
          {drop.reply_to && drop.reply_to.drop_id !== dropViewDropId && (
            <div className="tw-px-5 tw-pt-3 tw-pb-0">
              <Link 
                href={`/my-stream?wave=${drop.wave.id}&drop=${drop.reply_to.drop_id}`}
                className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400 hover:tw-text-primary-400 tw-no-underline tw-transition-colors"
              >
                <svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 9L9 15M15 15L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>In reply to a post</span>
              </Link>
            </div>
          )}

          {/* Two-column layout */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-12 tw-gap-5">
            {/* Left column - Metadata */}
            <div className="tw-col-span-1 md:tw-col-span-5 tw-p-5">
              {/* Header with rank and votes */}
              <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
                <WinnerDropBadge
                  rank={effectiveRank}
                  decisionTime={decisionTime}
                />
                
                <div className="tw-flex-1">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0.5">
                    {title}
                  </h3>
                  <p className="tw-text-sm tw-text-iron-400 tw-mb-0">
                    By {artistName}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              <div className="tw-mb-5">
                <p className="tw-text-iron-300">
                  {description}
                </p>
              </div>
              
              {/* Artist info */}
              <div className="tw-flex tw-items-center tw-gap-3">
                <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-text-iron-300">
                  {artistName[0].toUpperCase()}
                </div>
                <div>
                  <p className="tw-text-sm tw-font-medium tw-text-iron-200 tw-mb-0">{artistName}</p>
                  <p className="tw-text-xs tw-text-iron-400 tw-mb-0">Artist</p>
                </div>
              </div>
              
              {/* Winner callout */}
              <div className="tw-mt-4 tw-p-3 tw-bg-green-900/10 tw-border tw-border-green-900/20 tw-rounded-lg">
                <p className="tw-text-green-300 tw-text-sm tw-mb-0">
                  <span className="tw-font-medium">Winner:</span> This artwork has been selected as a winner in The Memes collection.
                </p>
              </div>
            </div>
            
            {/* Right column - Artwork */}
            <div className="tw-col-span-1 md:tw-col-span-7 tw-relative tw-bg-iron-900/30 tw-cursor-pointer" onClick={handleViewLarger}>
              <div className="tw-aspect-video tw-w-full tw-flex tw-items-center tw-justify-center tw-bg-iron-900/50">
                {artworkMedia ? (
                  <img 
                    src={artworkMedia} 
                    alt={title}
                    className="tw-max-w-full tw-max-h-full tw-object-contain"
                  />
                ) : (
                  <div className="tw-text-center tw-text-iron-400 tw-px-6">
                    <svg className="tw-w-16 tw-h-16 tw-mx-auto tw-mb-3 tw-text-iron-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.5 21C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 16.5L8.25 11.25C8.66421 10.8358 9.33579 10.8358 9.75 11.25L15 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.25 15.75L15.75 14.25C16.1642 13.8358 16.8358 13.8358 17.25 14.25L21 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="tw-text-sm">Artwork preview</p>
                  </div>
                )}
                
                {/* View larger button */}
                <div className="tw-absolute tw-bottom-3 tw-right-3">
                  <button 
                    className="tw-flex tw-items-center tw-gap-1.5 tw-bg-iron-950/80 tw-text-iron-300 tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewLarger();
                    }}
                  >
                    <svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 10L20 5M20 5V9M20 5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    View larger
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Votes info */}
          <div className="tw-p-5 tw-border-t tw-border-iron-800/50">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-flex tw-items-center tw-gap-2 tw-bg-iron-900/60 tw-py-1.5 tw-px-3 tw-rounded-full">
                <svg className="tw-w-4 tw-h-4 tw-text-primary-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 17.75L5.82802 20.995L7.00702 14.122L2.00702 9.25495L8.90702 8.25495L11.993 2.00195L15.079 8.25495L21.979 9.25495L16.979 14.122L18.158 20.995L12 17.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="tw-text-sm tw-font-medium tw-text-iron-200">{drop.ratings_count || 0} votes</span>
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