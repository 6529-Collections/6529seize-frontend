"use client";

import React, { useMemo, useRef } from "react";
import WebBrainLeftSidebarWaves from "./WebBrainLeftSidebarWaves";
import WebDirectMessagesList from "./WebDirectMessagesList";
import { usePathname } from "next/navigation";

interface WebBrainLeftSidebarProps {
  readonly activeWaveId: string | null | undefined;
}

const WebBrainLeftSidebar: React.FC<WebBrainLeftSidebarProps> = ({
  activeWaveId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Determine content type based on current route/context - WEB SPECIFIC LOGIC
  const isMessagesView = pathname?.startsWith("/messages");

  // Instead of calculating height, we'll use flex properties to fill parent container
  const sidebarStyle = useMemo(() => {
    const minHeight = "100%";
    return { minHeight };
  }, []);

  return (
    <div className="tw-relative tw-w-80 tw-h-full">
      <div
        ref={scrollContainerRef}
        className="tw-fixed tw-left-0 tw-top-0 tw-flex tw-flex-col tw-overflow-y-auto tw-w-80 tw-h-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-z-40"
        style={sidebarStyle}
      >
      <div className="tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0 tw-gap-y-4 tw-flex-col tw-flex tw-pt-4">
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          {!isMessagesView && (
            <WebBrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
          )}
          {isMessagesView && (
            <WebDirectMessagesList scrollContainerRef={scrollContainerRef} />
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default WebBrainLeftSidebar;
