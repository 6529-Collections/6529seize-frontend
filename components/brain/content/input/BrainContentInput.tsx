"use client";

import React from "react";
import { useWaveData } from "@/hooks/useWaveData";
import useCapacitor from "@/hooks/useCapacitor";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";

interface BrainContentInputProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContentInput: React.FC<BrainContentInputProps> = ({
  activeDrop,
  onCancelReplyQuote,
}) => {
  const capacitor = useCapacitor();
  const { data: wave } = useWaveData({
    waveId: activeDrop?.drop.wave.id ?? null,
    onWaveNotFound: () => onCancelReplyQuote(),
  });
  const containerClassName = capacitor.isCapacitor
    ? "tw-max-h-[calc(100vh-14.7rem)]"
    : "tw-max-h-[calc(100vh-20rem)] lg:tw-max-h-[calc(100vh-20rem)]";

  if (!wave) return null;

  return (
    <div
      className={`${containerClassName} tw-sticky tw-top-0 tw-z-30 tw-w-full tw-flex-none tw-overflow-y-auto tw-rounded-xl tw-bg-iron-950 tw-p-2 tw-shadow-lg tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 md:tw-p-4`}
    >
      <PrivilegedDropCreator
        wave={wave}
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
        onAllDropsAdded={onCancelReplyQuote}
        onDropAddedToQueue={onCancelReplyQuote}
        key={wave.id}
        dropId={null}
        fixedDropMode={DropMode.CHAT}
        focusOnInitialActiveDrop
      />
    </div>
  );
};

export default BrainContentInput;
