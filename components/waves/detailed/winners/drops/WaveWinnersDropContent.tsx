import React, { useState } from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import WaveDetailedDropContent from "../../drops/WaveDetailedDropContent";

interface WaveWinnersDropContentProps {
  readonly drop: ExtendedDrop;
}

export const WaveWinnersDropContent: React.FC<WaveWinnersDropContentProps> = ({
  drop,
}) => {
  const [activePartIndex, setActivePartIndex] = useState(0);
  return (
    <div className="tw-ml-[3.75rem] tw-mt-4 tw-rounded-lg tw-bg-iron-900/50 tw-px-4 tw-pb-4 tw-pt-2 tw-ring-1 tw-ring-iron-800/50">
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