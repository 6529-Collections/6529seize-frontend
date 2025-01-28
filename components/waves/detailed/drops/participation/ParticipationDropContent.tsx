import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import WaveDetailedDropContent from "../WaveDetailedDropContent";
import React from "react";

interface ParticipationDropContentProps {
  readonly drop: ExtendedDrop;
  readonly activePartIndex: number;
  readonly setActivePartIndex: (index: number) => void;
  readonly onLongPress: () => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly setLongPressTriggered: (triggered: boolean) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

export default function ParticipationDropContent({
  drop,
  activePartIndex,
  setActivePartIndex,
  onLongPress,
  onDropContentClick,
  onQuoteClick,
  setLongPressTriggered,
  parentContainerRef,
}: ParticipationDropContentProps) {
  return (
    <div className="tw-px-4 md:tw-px-6">
      <div className="tw-relative tw-rounded-xl tw-overflow-hidden tw-bg-iron-950/40">
        {/* Subtle border effects */}
        <div className="tw-absolute tw-inset-0 tw-ring-1 tw-ring-inset tw-ring-iron-700/10" />
        <div className="tw-absolute tw-inset-0 tw-ring-1 tw-ring-inset tw-ring-white/[0.02]" />

        {/* Edge highlights */}
        <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/[0.05] tw-to-transparent" />
        <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-white/[0.03] tw-to-transparent" />

        {/* Content wrapper */}
        <div className="tw-relative">
          {/* Soft edge fades */}
          <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-8 tw-bg-gradient-to-b tw-from-iron-950/20 tw-to-transparent" />
          <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-8 tw-bg-gradient-to-t tw-from-iron-950/20 tw-to-transparent" />

          {/* Content with padding */}
          <div className="tw-relative tw-px-5 tw-pt-2 tw-pb-4">
            <WaveDetailedDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
              onLongPress={onLongPress}
              onDropContentClick={onDropContentClick}
              onQuoteClick={onQuoteClick}
              setLongPressTriggered={setLongPressTriggered}
              parentContainerRef={parentContainerRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
