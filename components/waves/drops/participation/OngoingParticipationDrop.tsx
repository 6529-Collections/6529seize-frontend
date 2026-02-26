"use client";

import { useCallback, useState } from "react";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";



import WaveDropActions from "../WaveDropActions";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import WaveDropMobileMenu from "../WaveDropMobileMenu";

import ParticipationDropContainer from "./ParticipationDropContainer";
import ParticipationDropContent from "./ParticipationDropContent";
import ParticipationDropFooter from "./ParticipationDropFooter";
import ParticipationDropHeader from "./ParticipationDropHeader";
import ParticipationDropMetadata from "./ParticipationDropMetadata";

import type { DropInteractionParams, DropLocation } from "../Drop";


interface OngoingParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function OngoingParticipationDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuoteClick,
  onDropContentClick,
}: OngoingParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isMobile = useIsMobileDevice();
  const hasTouch = useIsTouchDevice() || isMobile;

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);

  const handleLongPress = useCallback(() => {
    if (!hasTouch) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [hasTouch]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]?.part_id! });
  }, [onReply, drop, activePartIndex]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  return (
    <ParticipationDropContainer
      drop={drop}
      isActiveDrop={isActiveDrop}
      location={location}
    >
      {!isMobile && showReplyAndQuote && (
        <WaveDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          showVoting={false}
          onReply={handleOnReply}
        />
      )}
      <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-gap-x-3 tw-border-0 tw-bg-transparent tw-px-4 tw-pt-4 tw-text-left">
        <WaveDropAuthorPfp drop={drop} />
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-y-1.5">
          <ParticipationDropHeader drop={drop} showWaveInfo={showWaveInfo} />
          <ParticipationDropContent
            drop={drop}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onLongPress={handleLongPress}
            onDropContentClick={onDropContentClick}
            onQuoteClick={onQuoteClick}
            setLongPressTriggered={setLongPressTriggered}
            isCompetitionDrop={true}
          />
        </div>
      </div>

      <div className="tw-flex tw-w-full tw-flex-col">
        <ParticipationDropMetadata
          metadata={drop.metadata}
          contextId={drop.id}
        />
        <ParticipationDropFooter drop={drop} />
      </div>

      {/* Mobile menu */}
      <WaveDropMobileMenu
        drop={drop}
        isOpen={isSlideUp}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onAddReaction={handleOnAddReaction}
      />
    </ParticipationDropContainer>
  );
}
