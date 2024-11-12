import React, { useState } from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import WaveDetailedDropContent from "../../drops/WaveDetailedDropContent";

interface WaveLeaderboardDropContentProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropContent: React.FC<
  WaveLeaderboardDropContentProps
> = ({ drop }) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  return (
    <div className="tw-mb-2">
      <WaveDetailedDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onDropClick={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
    </div>
  );
};
