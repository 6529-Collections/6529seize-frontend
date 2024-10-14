import React from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import WaveDetailedDropPart from "./WaveDetailedDropPart";
import DropContentWrapper from "./DropContentWrapper";

interface WaveDetailedDropContentProps {
  readonly drop: ApiDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropClick: () => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onDropClick,
  onQuoteClick,
  onLongPress,
  setLongPressTriggered,
  parentContainerRef,
}) => {
  return (
    <DropContentWrapper parentContainerRef={parentContainerRef}>
      <WaveDetailedDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropClick={onDropClick}
        onQuoteClick={onQuoteClick}
        onLongPress={onLongPress}
        setLongPressTriggered={setLongPressTriggered}
      />
    </DropContentWrapper>
  );
};

export default WaveDetailedDropContent;
