"use client";

import React, { useRef } from "react";
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
const WebLeftSidebar: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Determine content type based on current route/context - WEB SPECIFIC LOGIC
  const isMessagesView = pathname?.startsWith("/messages");

  return (
    <div className="tw-relative tw-w-full lg:tw-w-80 tw-h-full">
      <div
        ref={scrollContainerRef}
        className="tw-flex tw-flex-col tw-border-b-0 tw-border-iron-800 tw-border-solid tw-border-l-0 tw-border-t-0 tw-border-r-0 lg:tw-border-r tw-overflow-y-auto tw-w-full lg:tw-w-80 tw-h-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-z-40"
        style={{ minHeight: "100%" }}
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
