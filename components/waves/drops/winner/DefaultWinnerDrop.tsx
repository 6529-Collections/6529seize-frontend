"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import WaveDropActions from "../WaveDropActions";
import WaveDropReply from "../WaveDropReply";
import WaveDropContent from "../WaveDropContent";
import WaveDropHeader from "../WaveDropHeader";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import WaveDropRatings from "../WaveDropRatings";
import WaveDropMetadata from "../WaveDropMetadata";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import WinnerDropBadge from "./WinnerDropBadge";
import WaveDropReactions from "../WaveDropReactions";

const getRankColorsByRank = (
  rank: number | null
): {
  borderColor: string;
  textColor: string;
} => {
  const rankNumber =
    typeof rank === "string" ? parseInt(rank as string, 10) : rank;

  if (rankNumber === 1) {
    return {
      borderColor: "#fbbf24",
      textColor: "#E8D48A",
    };
  } else if (rankNumber === 2) {
    return {
      borderColor: "#C0C0C0",
      textColor: "#E8E8E8",
    };
  } else if (rankNumber === 3) {
    return {
      borderColor: "#CD7F32",
      textColor: "#CD7F32",
    };
  } else {
    return {
      borderColor: "#60606C",
      textColor: "#7F8A93",
    };
  }
};

const getDropStyles = (
  isActiveDrop: boolean,
  colors: { borderColor: string; textColor: string }
) => {
  if (isActiveDrop) {
    return {
      boxShadow: "inset 1.5px 0 0 rgba(60,203,127,0.7)",
    };
  }

  return {
    boxShadow: `inset 1.5px 0 0 ${colors.borderColor}, 
                inset 0 1px 0 ${colors.borderColor}20, 
                inset -1.5px 0 0 ${colors.borderColor}20, 
                inset 0 -1.5px 0 ${colors.borderColor}20`,
  };
};

interface DefautWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: Drop | null;
  readonly nextDrop: Drop | null;
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
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
}

const DefaultWinnerDrop = ({
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
}: DefautWinnerDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;
  const isMobile = useIsMobileDevice();

  const effectiveRank = drop.winning_context?.place ?? drop.rank;

  const decisionTime = drop.winning_context?.decision_time;

  const colors = getRankColorsByRank(effectiveRank);

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

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  return (
    <div
      className={`tw-w-full ${
        location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
      }`}>
      <div
        className={`tw-relative tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-3 tw-rounded-lg tw-overflow-hidden tw-group
          ${
            isActiveDrop
              ? "tw-bg-[#3CCB7F]/10"
              : location === DropLocation.WAVE
              ? "tw-bg-iron-900/60"
              : "tw-bg-iron-950"
          }`}
        style={{
          border: "1px solid transparent",
          borderLeft: "1.5px solid transparent",
          ...getDropStyles(isActiveDrop, colors),
          transition: "box-shadow 0.2s ease, background-color 0.2s ease",
        }}>
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

        <div className="tw-flex tw-gap-x-3 tw-w-full tw-text-left tw-bg-transparent tw-border-0 tw-relative tw-z-10">
          <WaveDropAuthorPfp drop={drop} />
          <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <WaveDropHeader
                drop={drop}
                showWaveInfo={false}
                isStorm={isStorm}
                currentPartIndex={activePartIndex}
                partsCount={drop.parts.length}
                badge={
                  <WinnerDropBadge
                    rank={effectiveRank}
                    decisionTime={decisionTime ?? null}
                  />
                }
              />
              {showWaveInfo && (() => {
                const waveDetails =
                  (drop.wave as unknown as {
                    chat?: { scope?: { group?: { is_direct_message?: boolean } } };
                  }) ?? undefined;
                const isDirectMessage =
                  waveDetails?.chat?.scope?.group?.is_direct_message ?? false;
                const waveHref = getWaveRoute({
                  waveId: drop.wave.id,
                  isDirectMessage,
                  isApp: false,
                });
                return (
                  <Link
                    href={waveHref}
                    onClick={(e) => e.stopPropagation()}
                    className="tw-text-xs tw-leading-none tw-mt-0.5 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline">
                    {drop.wave.name}
                  </Link>
                );
              })()}
            </div>
            <div>
              <WaveDropContent
                drop={drop}
                activePartIndex={activePartIndex}
                setActivePartIndex={setActivePartIndex}
                onDropContentClick={onDropContentClick}
                onQuoteClick={onQuoteClick}
                parentContainerRef={parentContainerRef}
                onLongPress={handleLongPress}
                setLongPressTriggered={setLongPressTriggered}
                isCompetitionDrop={true}
              />
            </div>
          </div>
        </div>
        {!isMobile && showReplyAndQuote && (
          <div className="tw-absolute tw-right-0 tw-top-1">
            <WaveDropActions
              drop={drop}
              activePartIndex={activePartIndex}
              onReply={handleOnReply}
              onQuote={handleOnQuote}
            />
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-gap-2 tw-ml-[3.25rem] tw-mt-1.5">
          {drop.metadata.length > 0 && (
            <WaveDropMetadata metadata={drop.metadata} />
          )}
          <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap">
            {!!drop.raters_count && <WaveDropRatings drop={drop} />}
            <WaveDropReactions drop={drop} />
          </div>
        </div>
      </div>
      <WaveDropMobileMenu
        drop={drop}
        isOpen={isSlideUp}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onQuote={handleOnQuote}
        onAddReaction={handleOnAddReaction}
      />
    </div>
  );
};

export default memo(DefaultWinnerDrop);
