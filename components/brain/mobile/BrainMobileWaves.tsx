import React, { useRef } from "react";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import { useLayout } from "../my-stream/layout/LayoutContext";


const BrainMobileWaves: React.FC = () => {
  const { mobileWavesViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // We'll use the mobileWavesViewStyle for capacitor spacing
  let containerClassName = `tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2`;

  return (
    <div className={containerClassName} style={mobileWavesViewStyle} ref={scrollContainerRef}>
      <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
    </div>
  );
};

export default BrainMobileWaves;
