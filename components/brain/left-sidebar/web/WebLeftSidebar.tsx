"use client";

import React, { useRef } from "react";
import WebBrainLeftSidebarWaves from "./WebBrainLeftSidebarWaves";
import WebDirectMessagesList from "./WebDirectMessagesList";
import MemesWaveFooter from "../waves/MemesWaveFooter";
import {
  LazyMemesQuickVoteRuntime,
  useMemesQuickVoteRuntimeLauncher,
} from "../waves/memes-quick-vote/MemesQuickVoteRuntimeLoader";
import { usePathname } from "next/navigation";
import { useSidebarState } from "../../../../hooks/useSidebarState";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import {
  WAVE_HEADER_ACTION_CLASSES,
  WAVE_HEADER_ACTION_SURFACE_CLASSES,
} from "../waves/WaveHeaderActions";

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
  readonly showProfileFeedShortcut?: boolean | undefined;
}

const WebLeftSidebarQuickVoteOwner: React.FC<{
  readonly isCollapsed: boolean;
}> = ({ isCollapsed }) => {
  const quickVote = useMemesQuickVoteRuntimeLauncher();

  return (
    <>
      <div className="tw-flex-shrink-0 tw-bg-black">
        <MemesWaveFooter
          collapsed={isCollapsed}
          onOpenQuickVote={quickVote.openQuickVote}
          onPrefetchQuickVote={quickVote.prefetchQuickVote}
        />
      </div>
      {quickVote.shouldMountRuntime && quickVote.runtimeIntent && (
        <LazyMemesQuickVoteRuntime
          intent={quickVote.runtimeIntent}
          onIdle={quickVote.resetQuickVoteRuntime}
        />
      )}
    </>
  );
};

const WebLeftSidebar: React.FC<WebLeftSidebarProps> = ({
  isCollapsed = false,
  showProfileFeedShortcut = true,
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
          className={`tw-z-40 tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-transition-colors tw-duration-500 ${isMessagesView ? "tw-no-scrollbar" : "desktop-hover:tw-scrollbar-thin desktop-hover:tw-scrollbar-track-iron-800 desktop-hover:tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"}`}
        >
          {isCollapsed && (
            <div
              className={`tw-sticky tw-z-20 tw-flex tw-justify-center ${
                isMessagesView
                  ? "tw-top-2 tw-py-2"
                  : "tw-top-0 tw-h-11 tw-shrink-0 tw-items-center"
              }`}
            >
              <div
                aria-hidden="true"
                className="tw-pointer-events-none tw-absolute tw-inset-x-0 -tw-top-2 tw-h-[76px] tw-bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(0,0,0,0.96)_45%,rgba(0,0,0,0)_100%)]"
              />
              <button
                type="button"
                onClick={closeRightSidebar}
                onMouseDown={(event) => event.preventDefault()}
                aria-label={expandLabel}
                title={expandLabel}
                className={`tw-relative tw-z-10 ${WAVE_HEADER_ACTION_CLASSES}`}
              >
                <span className={WAVE_HEADER_ACTION_SURFACE_CLASSES}>
                  <ChevronDoubleRightIcon
                    strokeWidth={2}
                    aria-hidden="true"
                    className="tw-size-4 tw-flex-shrink-0"
                  />
                </span>
              </button>
            </div>
          )}
          {!isMessagesView && (
            <WebBrainLeftSidebarWaves
              scrollContainerRef={scrollContainerRef}
              isCollapsed={isCollapsed}
              showProfileFeedShortcut={showProfileFeedShortcut}
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
