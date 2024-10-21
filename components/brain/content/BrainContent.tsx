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
    <div className="tw-mt-8 tw-pb-8 tw-flex-1 tw-h-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar tailwind-scope">
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
