import React, { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";
import WaveDetailedDropContent from "../drops/WaveDetailedDropContent";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";

interface WaveDropContentProps {
  readonly drop: ApiDrop;
}

export const WaveDropContent: React.FC<WaveDropContentProps> = ({ drop }) => {
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
