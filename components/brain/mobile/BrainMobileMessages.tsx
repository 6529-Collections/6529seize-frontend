"use client";

import React, { useRef } from "react";
import DirectMessagesList from "../direct-messages/DirectMessagesList";
import { useLayout } from "../my-stream/layout/LayoutContext";

const floatingDockClearanceClassName =
  "tw-pb-[calc(4rem+env(safe-area-inset-bottom,0px))]";

const BrainMobileMessages: React.FC = () => {
  const { mobileWavesViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      data-mobile-bottom-nav-scroll-target="true"
      ref={scrollContainerRef}
      className={`tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-pt-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 md:tw-px-6 ${floatingDockClearanceClassName}`}
      style={mobileWavesViewStyle}
    >
      <DirectMessagesList scrollContainerRef={scrollContainerRef} />
    </div>
  );
};

export default BrainMobileMessages;
