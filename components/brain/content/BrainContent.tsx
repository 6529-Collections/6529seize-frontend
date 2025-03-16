import React from "react";
import BrainContentPinnedWaves from "./BrainContentPinnedWaves";
import BrainContentInput from "./input/BrainContentInput";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { useLayout } from "../my-stream/layout/LayoutContext";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly showPinnedWaves?: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly waveId?: string;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  showPinnedWaves = true,
  activeDrop,
  onCancelReplyQuote,
  waveId,
}) => {
  // Get layout context references for measuring
  const { pinnedRef } = useLayout();

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full">
      {showPinnedWaves && (
        <div 
          ref={pinnedRef}
          className="tw-sticky tw-top-0 tw-z-10 tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0"
        >
          <BrainContentPinnedWaves />
        </div>
      )}
      <div className="tw-flex-1 tw-overflow-hidden">
        <div className="tw-h-full">{children}</div>
      </div>
      <div 
        className="tw-sticky tw-bottom-0 tw-z-10 tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0"
      >
        <BrainContentInput
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
        />
      </div>
    </div>
  );
};

export default BrainContent;
