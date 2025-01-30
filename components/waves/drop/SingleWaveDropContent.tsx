import React, { useState } from "react";
import { SingleWaveDropContentMetadata } from "./SingleWaveDropContentMetadata";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WaveDropContent from "../drops/WaveDropContent";

interface SingleWaveDropContentProps {
  readonly drop: ExtendedDrop;
}

export const SingleWaveDropContent: React.FC<SingleWaveDropContentProps> = ({ drop }) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  return (
    <div className="tw-mb-2 tw-flex tw-flex-col">
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
      {!!drop.metadata.length && <SingleWaveDropContentMetadata drop={drop} />}
    </div>
  );
}; 