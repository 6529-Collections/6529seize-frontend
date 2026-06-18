"use client";

import React from "react";
import BrainContentInput from "./input/BrainContentInput";
import type { ActiveDropState } from "@/types/dropInteractionTypes";

interface BrainContentProps {
  readonly children: React.ReactNode;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContent: React.FC<BrainContentProps> = ({
  children,
  activeDrop,
  onCancelReplyQuote,
}) => {
  return (
    <div className="tw-relative tw-flex tw-h-full tw-min-h-0 tw-flex-col">
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-hidden">
        <div className="tw-h-full tw-min-h-0">{children}</div>
      </div>
      {activeDrop && (
        <div className="tw-sticky tw-bottom-0 tw-z-[80] tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
          <BrainContentInput
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
          />
        </div>
      )}
    </div>
  );
};

export default BrainContent;
