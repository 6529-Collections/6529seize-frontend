"use client";

import React, { useRef } from "react";
import WebBrainLeftSidebarWaves from "./WebBrainLeftSidebarWaves";
import WebDirectMessagesList from "./WebDirectMessagesList";
import { usePathname } from "next/navigation";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";

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
  readonly isCollapsed?: boolean | undefined;
}

const WebLeftSidebar: React.FC<WebLeftSidebarProps> = ({
  isCollapsed = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { closeRightSidebar } = useSidebarState();

  // Determine content type based on current route/context - WEB SPECIFIC LOGIC
  const isMessagesView = pathname?.startsWith("/messages");
  const expandLabel = isMessagesView
    ? "Expand messages panel"
    : "Expand waves panel";

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
        {isCollapsed && (
          <div className="tw-sticky tw-top-2 tw-z-20 tw-flex tw-justify-center tw-py-2">
            <button
              type="button"
              onClick={closeRightSidebar}
              onMouseDown={(event) => event.preventDefault()}
              aria-label={expandLabel}
              title={expandLabel}
              className="desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)] tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-h-6 tw-w-6 tw-rounded-lg"
            >
              <ChevronDoubleRightIcon
                strokeWidth={2}
                className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 group-hover:desktop-hover:hover:tw-text-white tw-transition-all tw-duration-300 tw-ease-in-out"
              />
            </button>
          </div>
        )}
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
