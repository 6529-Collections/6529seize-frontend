import React from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropPart from "./WaveDetailedDropPart";

interface WaveDetailedDropContentProps {
  readonly drop: Drop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onDropClick: () => void;
  readonly onQuoteClick: (drop: Drop) => void;
  readonly onLongPress: () => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onDropClick,
  onQuoteClick,
  onLongPress,
  setLongPressTriggered,
}) => {
  return (
    <div>
      <WaveDetailedDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropClick={onDropClick}
        onQuoteClick={onQuoteClick}
        onLongPress={onLongPress}
        setLongPressTriggered={setLongPressTriggered}
      />
    </div>
  );
};

export default WaveDetailedDropContent;
