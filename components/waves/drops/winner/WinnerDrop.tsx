import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import WaveDropActions from "../WaveDropActions";
import WaveDropReply from "../WaveDropReply";
import WaveDropContent from "../WaveDropContent";
import WaveDropHeader from "../WaveDropHeader";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import WaveDropRatings from "../WaveDropRatings";
import WaveDropMetadata from "../WaveDropMetadata";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import WinnerDropBadge from "./WinnerDropBadge";

// Get rank-specific colors
const getRankColorsByRank = (rank: number | null): { 
  borderColor: string,
  textColor: string
} => {
  // Convert rank to a number to ensure proper comparison
  const rankNumber = typeof rank === 'string' ? parseInt(rank as string, 10) : rank;
  
  if (rankNumber === 1) {
    return {
      borderColor: "#E8D48A", // Gold
      textColor: "#E8D48A"
    };
  } else if (rankNumber === 2) {
    return {
      borderColor: "#DDDDDD", // Silver
      textColor: "#DDDDDD"
    };
  } else if (rankNumber === 3) {
    return {
      borderColor: "#CD7F32", // Bronze
      textColor: "#CD7F32"
    };
  } else {
    return {
      borderColor: "#7F8A93", // Gray for all other ranks
      textColor: "#7F8A93"
    };
  }
};

interface WinnerDropProps {
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

const WinnerDrop = ({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  location,
  dropViewDropId,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
  showReplyAndQuote,
  parentContainerRef,
}: WinnerDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  // For winner drops, we should always show the rank-specific border
  // Forcing isActiveDrop to false ensures the colored border is always visible
  const isActiveDrop = false; // Override activeDrop?.drop.id === drop.id
  const isStorm = drop.parts.length > 1;
  const isMobile = useIsMobileDevice();

  const round = drop.decision_round || 1;
  const position = drop.position_in_rank || 1;
  
  // Make sure we have a rank value to work with (fallback to position if rank is missing)
  const effectiveRank = drop.rank !== null && drop.rank !== undefined ? drop.rank : position;
  
  // Get colors based on effective rank
  const colors = getRankColorsByRank(effectiveRank);

  const handleOnReply = useCallback(() => {
    onReply({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onReply, drop, activePartIndex]);

  const handleOnQuote = useCallback(() => {
    onQuote({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onQuote, drop, activePartIndex]);

  return (
    <div
      className={`tw-w-full ${
        location === DropLocation.WAVE ? "tw-px-4" : ""
      }`}
    >
      <div
        className={`tw-relative tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-3 tw-transition-all tw-duration-300 tw-rounded-lg
          ${
            isActiveDrop
              ? "tw-bg-[#3CCB7F]/5 tw-border-l-2 tw-border-l-[#3CCB7F]/70 tw-border-solid tw-border-y-0 tw-border-r-0"
              : "tw-bg-iron-950/80 tw-backdrop-blur-sm tw-border-0" /* Remove default borders so we can apply custom ones */
          }`}
        style={{
          borderLeft: isActiveDrop ? undefined : `2px solid ${colors.borderColor}`,
          borderTop: isActiveDrop ? undefined : `1px solid ${colors.borderColor}20`,
          borderRight: isActiveDrop ? undefined : `1px solid ${colors.borderColor}20`,
          borderBottom: isActiveDrop ? undefined : `1px solid ${colors.borderColor}20`
        }}
      >
        {/* Reply reference if needed */}
        {drop.reply_to && drop.reply_to.drop_id !== dropViewDropId && (
          <WaveDropReply
            onReplyClick={onReplyClick}
            dropId={drop.reply_to.drop_id}
            dropPartId={drop.reply_to.drop_part_id}
            maybeDrop={
              drop.reply_to.drop
                ? { ...drop.reply_to.drop, wave: drop.wave }
                : null
            }
          />
        )}

        {/* Main content area */}
        <div className="tw-flex tw-gap-x-3 tw-w-full tw-text-left tw-bg-transparent tw-border-0">
          {/* Author profile picture */}
          <div className="tw-relative">
            <WaveDropAuthorPfp drop={drop} />
          </div>

          {/* Content area */}
          <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-1">
            {/* Header with winner badge */}
            <div className="tw-flex tw-items-center tw-justify-between">
              <WaveDropHeader
                drop={drop}
                showWaveInfo={showWaveInfo}
                isStorm={isStorm}
                currentPartIndex={activePartIndex}
                partsCount={drop.parts.length}
              />
              <WinnerDropBadge 
                rank={effectiveRank} 
                round={round}
                position={position}
              />
            </div>

            {/* Drop content */}
            <div>
              <WaveDropContent
                drop={drop}
                activePartIndex={activePartIndex}
                setActivePartIndex={setActivePartIndex}
                onDropContentClick={onDropContentClick}
                onQuoteClick={onQuoteClick}
                parentContainerRef={parentContainerRef}
                onLongPress={() => {}}
                setLongPressTriggered={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Bottom action buttons */}
        {!isMobile && showReplyAndQuote && (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          />
        )}

        {/* Metadata and ratings */}
        <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-ml-[3.25rem] tw-mt-1.5">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            {drop.metadata.length > 0 && (
              <WaveDropMetadata metadata={drop.metadata} />
            )}
            {!!drop.raters_count && <WaveDropRatings drop={drop} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(WinnerDrop);
