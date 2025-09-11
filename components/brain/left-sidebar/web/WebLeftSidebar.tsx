"use client";

import React, { useMemo, useRef } from "react";
import WebBrainLeftSidebarWaves from "./WebBrainLeftSidebarWaves";
import WebDirectMessagesList from "./WebDirectMessagesList";
import { usePathname } from "next/navigation";

/**
 * WebLeftSidebar
 *
 * Web‑specific left sidebar content. Chooses between Waves and Direct Messages
 * sections based on the current pathname ("/messages" routes show DMs).
 *
 * Rendering
 * - Uses an internal scroll container to enable inertia scrolling and custom
 *   scrollbars without managing explicit heights; relies on parent layout flex.
 */
interface WebLeftSidebarProps {
  readonly activeWaveId: string | null | undefined;
}

const WebLeftSidebar: React.FC<WebLeftSidebarProps> = ({ activeWaveId }) => {
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
        className="tw-flex tw-flex-col tw-overflow-y-auto tw-w-80 tw-h-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-z-40"
        style={sidebarStyle}
      >
        {!isMessagesView && (
          <WebBrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
        )}
        {isMessagesView && (
          <WebDirectMessagesList scrollContainerRef={scrollContainerRef} />
        )}
      </div>
    </div>
  );
};

export default WebLeftSidebar;
