import React, { useState } from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import WaveDetailedDropContent from "../../drops/WaveDetailedDropContent";

interface WaveLeaderboardDropContentProps {
  readonly drop: ExtendedDrop;
  readonly setActiveDrop: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardDropContent: React.FC<
  WaveLeaderboardDropContentProps
> = ({ drop, setActiveDrop }) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  const onDropClick = () => {
    setActiveDrop(drop);
  };

  return (
    <div className="tw-mb-2">
      <WaveDetailedDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onDropClick={onDropClick}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
    </div>
  );
};
