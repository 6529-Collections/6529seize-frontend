import React, { useState } from "react";
import WaveDetailedDropContent from "../drops/WaveDetailedDropContent";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import { WaveDropContentMetadata } from "./WaveDropContentMetadata";

interface WaveDropContentProps {
  readonly drop: ApiDrop;
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
        onDropClick={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
      {!!drop.metadata.length && <WaveDropContentMetadata drop={drop} />}
    </div>
  );
};
