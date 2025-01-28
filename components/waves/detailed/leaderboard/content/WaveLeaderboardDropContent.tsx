import React, { useState } from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import WaveDetailedDropContent from "../../drops/WaveDetailedDropContent";
import WaveDetailedDropMetadata from "../../drops/WaveDetailedDropMetadata";

interface WaveLeaderboardDropContentProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropContent: React.FC<
  WaveLeaderboardDropContentProps
> = ({ drop }) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  return (
    <div className="tw-flex tw-gap-x-6 tw-items-end tw-justify-between">
      <WaveDetailedDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
      {!!drop.metadata.length && (
        <div className="tw-mt-2">
          <WaveDetailedDropMetadata metadata={drop.metadata} />
        </div>
      )}
    </div>
  );
};
