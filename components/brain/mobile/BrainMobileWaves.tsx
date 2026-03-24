"use client";

import React, { useRef } from "react";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import MemesWaveFooter from "../left-sidebar/waves/MemesWaveFooter";
import { useLayout } from "../my-stream/layout/LayoutContext";

interface BrainMobileWavesProps {
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({
  onOpenQuickVote,
  onPrefetchQuickVote,
}) => {
  const { mobileWavesViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // We'll use the mobileWavesViewStyle for capacitor spacing
  const scrollContainerClassName =
    "tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2";

  return (
    <div
      className="tw-flex tw-h-full tw-min-h-0 tw-flex-col"
      style={mobileWavesViewStyle}
    >
      <div className={scrollContainerClassName} ref={scrollContainerRef}>
        <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
      </div>
      <MemesWaveFooter
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
      />
    </div>
  );
};

export default BrainMobileWaves;
