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
      <div className="tw-ml-auto">
        <div className="tw-flex tw-flex-wrap tw-gap-y-1 tw-py-2 tw-px-2 tw-gap-x-2 tw-text-xs tw-text-iron-300">
          <div className="tw-flex tw-items-center tw-gap-x-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-size-4 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
            <div className="tw-truncate">
              <span className="tw-font-semibold">Key:</span> Value
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-x-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-size-4 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
            <div className="tw-truncate">
              <span className="tw-font-semibold">Key:</span> Value
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
