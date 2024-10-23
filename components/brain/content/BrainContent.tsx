import React from "react";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";

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
  return (
    <div className="lg:tw-mt-8 tw-pb-2 lg:tw-pb-8 tw-flex tw-flex-col tw-h-[calc(100vh-10.75rem)] lg:tw-h-full lg:tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin no-scrollbar tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300  tailwind-scope">
      {showPinnedWaves && <BrainContentPinnedWaves />}
      <BrainContentInput
        waveId={waveId}
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
      />
      <div className="tw-mt-2 tw-flex-1">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
