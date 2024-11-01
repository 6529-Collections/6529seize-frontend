import React from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";
import { useWaveData } from "../../../hooks/useWaveData";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly showPinnedWaves?: boolean;
  readonly waveId: string | null;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  showPinnedWaves = true,
  waveId,
  activeDrop,
  onCancelReplyQuote,
}) => {
  const capacitor = useCapacitor();

  const containerClassName = `lg:tw-mt-6 tw-pb-2 lg:tw-pb-12 tw-flex tw-flex-col tw-h-[calc(100vh-10.75rem)] lg:tw-h-full lg:tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin no-scrollbar tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tailwind-scope${
    capacitor.isCapacitor ? " tw-pb-[calc(4rem+80px)]" : ""
  }`;

  const { data: wave } = useWaveData(waveId);

  return (
    <div className={containerClassName}>
      {showPinnedWaves && <BrainContentPinnedWaves />}
      <BrainContentInput
        waveId={waveId}
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
      />
      <div className="tw-mt-2 tw-flex-1">
        {!!wave && (
          <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-2">
            <h2 className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-200">
              <span>{wave.name}</span>{" "}
              <span className="tw-text-iron-400">Stream</span>
            </h2>
            <div className="tw-flex-1 tw-h-px tw-bg-iron-900" />
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
