import React, { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/wave-drops.helpers";
import WaveDetailedDropContent from "../drops/WaveDetailedDropContent";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import Tippy from "@tippyjs/react";

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
      <Tippy
        content={<span className="tw-text-xs">Metadata</span>}
        placement="top"
      >
        <div className="tw-ml-auto">
          <svg
            className="tw-size-4 tw-text-iron-400 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
  );
};
