"use client";

import React, { useRef, useState } from "react";
import WebBrainLeftSidebarWaves from "./WebBrainLeftSidebarWaves";
import WebDirectMessagesList from "./WebDirectMessagesList";
import MemesWaveFooter from "../waves/MemesWaveFooter";
import MemesQuickVoteDialog from "../waves/memes-quick-vote/MemesQuickVoteDialog";
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

const WebLeftSidebarQuickVoteOwner: React.FC<{
  readonly isCollapsed: boolean;
}> = ({ isCollapsed }) => {
  const [isQuickVoteOpen, setIsQuickVoteOpen] = useState(false);
  const [quickVoteSessionId, setQuickVoteSessionId] = useState(0);

  const handleOpenQuickVote = () => {
    setQuickVoteSessionId((current) => current + 1);
    setIsQuickVoteOpen(true);
  };

  return (
    <>
      <div className="tw-flex-shrink-0 tw-bg-black">
        <MemesWaveFooter
          collapsed={isCollapsed}
          onOpenQuickVote={handleOpenQuickVote}
        />
      </div>
      <MemesQuickVoteDialog
        isOpen={isQuickVoteOpen}
        sessionId={quickVoteSessionId}
        onClose={() => setIsQuickVoteOpen(false)}
      />
    </>
  );
};

const WebLeftSidebar: React.FC<WebLeftSidebarProps> = ({
  isCollapsed = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { closeRightSidebar } = useSidebarState();

  // Determine content type based on current route/context - WEB SPECIFIC LOGIC
  const isMessagesView = pathname.startsWith("/messages");
  const expandLabel = isMessagesView
    ? "Expand messages panel"
    : "Expand waves panel";

  return (
    <div
      className={`tw-relative tw-h-full tw-w-full ${
        isCollapsed ? "lg:tw-w-16" : "lg:tw-w-80"
      }`}
    >
      <div
        className={`tw-flex tw-h-full tw-w-full tw-flex-col tw-border-b-0 tw-border-l-0 tw-border-r tw-border-t-0 tw-border-solid tw-border-iron-700/95 ${
          isCollapsed ? "lg:tw-w-16" : "lg:tw-w-80"
        }`}
        style={{ minHeight: "100%" }}
      >
        <div
          ref={scrollContainerRef}
          className="no-scrollbar tw-z-40 tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
        >
          {isCollapsed && (
            <div className="tw-sticky tw-top-2 tw-z-20 tw-flex tw-justify-center tw-py-2">
              <button
                type="button"
                onClick={closeRightSidebar}
                onMouseDown={(event) => event.preventDefault()}
                aria-label={expandLabel}
                title={expandLabel}
                className="tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)]"
              >
                <ChevronDoubleRightIcon
                  strokeWidth={2}
                  className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 tw-transition-all tw-duration-300 tw-ease-in-out group-hover:desktop-hover:hover:tw-text-white"
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
        {!isMessagesView && (
          <WebLeftSidebarQuickVoteOwner isCollapsed={isCollapsed} />
        )}
      </div>
    </div>
  );
};

export default WebLeftSidebar;
