import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { useCallback, useState } from "react";
import useIsMobileDevice from "../../../../../hooks/isMobileDevice";
import WaveDetailedDropActions from "../WaveDetailedDropActions";
import WaveDetailedDropMobileMenu from "../WaveDetailedDropMobileMenu";
import ParticipationDropContainer from "./ParticipationDropContainer";
import ParticipationDropHeader from "./ParticipationDropHeader";
import ParticipationDropContent from "./ParticipationDropContent";
import ParticipationDropMetadata from "./ParticipationDropMetadata";
import ParticipationDropFooter from "./ParticipationDropFooter";

interface ParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

export default function ParticipationDrop({
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
}: ParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();

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

  return (
    <ParticipationDropContainer
      drop={drop}
      isActiveDrop={isActiveDrop}
      location={location}
    >
      {!isMobile && showReplyAndQuote && (
        <WaveDetailedDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          showVoting={false}
          onReply={handleOnReply}
          onQuote={handleOnQuote}
        />
      )}
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
      />
      <ParticipationDropMetadata metadata={drop.metadata} />
      <ParticipationDropFooter drop={drop} />
      <WaveDetailedDropMobileMenu
        drop={drop}
        isOpen={isSlideUp}
        longPressTriggered={longPressTriggered}
        showReplyAndQuote={showReplyAndQuote}
        setOpen={setIsSlideUp}
        onReply={handleOnReply}
        onQuote={handleOnQuote}
      />
    </ParticipationDropContainer>
  );
}
