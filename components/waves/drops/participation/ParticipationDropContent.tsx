import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import React from "react";
import WaveDropContent from "../WaveDropContent";

interface ParticipationDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onLongPress: () => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function ParticipationDropContent({
  drop,
  activePartIndex,
  setActivePartIndex,
  onLongPress,
  onDropContentClick,
  onQuoteClick,
  setLongPressTriggered,
  parentContainerRef,
}: ParticipationDropContentProps) {
  return (
    <div className="tw-mt-1">
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={onLongPress}
        onDropContentClick={onDropContentClick}
        onQuoteClick={onQuoteClick}
        setLongPressTriggered={setLongPressTriggered}
        parentContainerRef={parentContainerRef}
      />
    </div>
  );
}