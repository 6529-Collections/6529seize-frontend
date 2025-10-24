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
interface WebLeftSidebarProps {
  readonly isCollapsed?: boolean;
}

const WebLeftSidebar: React.FC<WebLeftSidebarProps> = ({
  isCollapsed = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Determine content type based on current route/context - WEB SPECIFIC LOGIC
  const isMessagesView = pathname?.startsWith("/messages");

  return (
    <div
      className={`tw-relative tw-w-full tw-h-full ${
        isCollapsed ? "lg:tw-w-16" : "lg:tw-w-80"
      }`}
    >
      <div
        ref={scrollContainerRef}
        className={`tw-flex tw-flex-col tw-border-b-0 tw-border-iron-700/95 tw-border-solid tw-border-l-0 tw-border-t-0 tw-border-r tw-overflow-y-auto tw-w-full tw-h-full tw-scrollbar-thin no-scrollbar tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-z-40 ${
          isCollapsed ? "lg:tw-w-16" : "lg:tw-w-80"
        }`}
        style={{ minHeight: "100%" }}
      >
        {!isMessagesView && (
          <WebBrainLeftSidebarWaves
            scrollContainerRef={scrollContainerRef}
            isCollapsed={isCollapsed}
          />
        )}
        {isMessagesView && (
          <WebDirectMessagesList
            scrollContainerRef={scrollContainerRef}
            isCollapsed={isCollapsed}
          />
        )}
      </div>
    </div>
  );
};

export default WebLeftSidebar;
