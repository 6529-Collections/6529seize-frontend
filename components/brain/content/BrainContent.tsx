import React from "react";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly showPinnedWaves?: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  showPinnedWaves = true,
  activeDrop,
  onCancelReplyQuote,
}) => {
  return (
    <div className="lg:tw-pr-2 tw-relative tw-flex tw-flex-col tw-h-full tw-pb-6">
      {showPinnedWaves && (
        <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-black">
          <BrainContentPinnedWaves />
        </div>
      )}
      <div className="tw-flex-1 tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
        <div>{children}</div>
      </div>
      <div className="tw-sticky tw-bottom-0 tw-z-10 tw-bg-iron-950">
        <BrainContentInput
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
          onDropAddedToQueue={onCancelReplyQuote}
        />
      </div>
    </div>
  );
};

export default BrainContent;
