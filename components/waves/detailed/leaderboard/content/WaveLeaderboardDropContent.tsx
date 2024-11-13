import React, { useState } from "react";
import Tippy from "@tippyjs/react";
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
        <Tippy
          content={<span className="tw-text-xs">Metadata</span>}
          placement="top"
        >
          <div>
            <svg
              className="tw-size-4 tw-text-iron-400 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Tippy>
      </div>
    </div>
  );
};
