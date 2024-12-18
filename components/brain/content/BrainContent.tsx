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
    <div className="lg:tw-pr-2">
      {showPinnedWaves && <BrainContentPinnedWaves />}
      <BrainContentInput
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
        onDropAddedToQueue={onCancelReplyQuote}
      />
      <div className="tw-flex-1">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BrainContent;
