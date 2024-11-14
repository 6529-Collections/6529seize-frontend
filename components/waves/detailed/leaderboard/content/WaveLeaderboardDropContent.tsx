import React, { useState } from "react";
import Tippy from "@tippyjs/react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import WaveDetailedDropContent from "../../drops/WaveDetailedDropContent";
import WaveDetailedDropMetadata from "../../drops/WaveDetailedDropMetadata";

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
      <div className="tw-flex tw-gap-x-6 tw-items-end tw-justify-between">
        <WaveDetailedDropContent
          drop={drop}
          activePartIndex={activePartIndex}
          setActivePartIndex={setActivePartIndex}
          onLongPress={() => {}}
          onDropClick={onDropClick}
          onQuoteClick={() => {}}
          setLongPressTriggered={() => {}}
        />
        {!!drop.metadata.length && (
          <WaveDetailedDropMetadata metadata={drop.metadata} />
        )}
      </div>
    </div>
  );
};
