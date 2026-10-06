"use client";

import React, { useRef } from "react";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import { MemesWaveFooterView } from "../left-sidebar/waves/MemesWaveFooter";
import { useLayout } from "../my-stream/layout/LayoutContext";
import {
  MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME,
  MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME,
} from "../left-sidebar/waves/MemesWaveFooter.constants";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";

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
  useKeyboardFocusScroll(scrollContainerRef);
  // Keep mobile scroll clearance and footer rendering on the same stats hook instance.
  const footerStats = useMemesWaveFooterStats();
  const scrollClearanceClassName = footerStats.isAvailable
    ? MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME
    : MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME;
  const scrollContainerClassName = `tw-min-h-0 tw-flex-1 tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 md:tw-px-6 ${scrollClearanceClassName}`;

  return (
    <div
      className="tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-[#0d0d0e]"
      style={mobileWavesViewStyle}
    >
      <div
        data-mobile-bottom-nav-scroll-target="true"
        className={scrollContainerClassName}
        ref={scrollContainerRef}
      >
        <div className="tw-pt-2">
          <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
        </div>
      </div>
      <MemesWaveFooterView
        floating
        onOpenQuickVote={onOpenQuickVote}
        onPrefetchQuickVote={onPrefetchQuickVote}
        stats={footerStats}
      />
    </div>
  );
};

export default BrainMobileWaves;
