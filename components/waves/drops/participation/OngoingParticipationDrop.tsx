"use client";

import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { useCallback, useState } from "react";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import WaveDropActions from "../WaveDropActions";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import ParticipationDropContainer from "./ParticipationDropContainer";
import ParticipationDropHeader from "./ParticipationDropHeader";
import ParticipationDropContent from "./ParticipationDropContent";
import ParticipationDropMetadata from "./ParticipationDropMetadata";
import ParticipationDropFooter from "./ParticipationDropFooter";

interface OngoingParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function OngoingParticipationDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
  onQuoteClick,
  onDropContentClick,
  parentContainerRef,
}: OngoingParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isMobile = useIsMobileDevice();

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);

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
    <ParticipationDropContainer
      drop={drop}
      isActiveDrop={isActiveDrop}
      location={location}>
      {!isMobile && showReplyAndQuote && (
        <WaveDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          showVoting={false}
          onReply={handleOnReply}
          onQuote={handleOnQuote}
        />
      )}
      <div className="tw-flex tw-gap-x-3 tw-relative tw-z-10 tw-w-full tw-text-left tw-bg-transparent tw-border-0 tw-px-4 tw-pt-4">
        <WaveDropAuthorPfp drop={drop} />
        <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-1.5">
          <ParticipationDropHeader drop={drop} showWaveInfo={showWaveInfo} />
          <ParticipationDropContent
            drop={drop}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onLongPress={handleLongPress}
            onDropContentClick={onDropContentClick}
            onQuoteClick={onQuoteClick}
            setLongPressTriggered={setLongPressTriggered}
            parentContainerRef={parentContainerRef}
            isCompetitionDrop={true}
          />
        </div>
      </div>

      <div className="tw-flex tw-w-full tw-flex-col">
        <ParticipationDropMetadata metadata={drop.metadata} />
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
        onQuote={handleOnQuote}
        onAddReaction={handleOnAddReaction}
      />
    </ParticipationDropContainer>
  );
}
