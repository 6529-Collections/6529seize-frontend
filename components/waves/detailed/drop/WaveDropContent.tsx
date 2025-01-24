import React, { useState } from "react";
import WaveDetailedDropContent from "../drops/WaveDetailedDropContent";
import { WaveDropContentMetadata } from "./WaveDropContentMetadata";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

interface WaveDropContentProps {
  readonly drop: ExtendedDrop;
}

export const WaveDropContent: React.FC<WaveDropContentProps> = ({ drop }) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  return (
    <div className="tw-mb-2 tw-flex tw-flex-col">
      <WaveDetailedDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
      {!!drop.metadata.length && <WaveDropContentMetadata drop={drop} />}
    </div>
  );
};
