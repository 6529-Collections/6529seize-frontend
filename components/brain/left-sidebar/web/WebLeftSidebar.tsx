"use client";

import React, { useMemo, useRef } from "react";
import { BrainLeftSidebarViewChange } from "../BrainLeftSidebarViewChange";
import BrainLeftSidebarSearchWave from "../search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../waves/BrainLeftSidebarWaves";
import { useContentTab } from "../../ContentTabContext";
import { MyStreamWaveTab } from "../../../../types/waves.types";
import DirectMessagesList from "../../direct-messages/DirectMessagesList";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../auth/Auth";
import { TabToggle } from "../../../common/TabToggle";

interface WebLeftSidebarProps {
  readonly activeWaveId: string | null | undefined;
}

const WebLeftSidebar: React.FC<WebLeftSidebarProps> = ({
  activeWaveId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { connectedProfile } = useAuth();

  // Get content tab state from context
  const { activeContentTab, setActiveContentTab, availableTabs } =
    useContentTab();

  // Determine content type based on current route - URL-based instead of TabToggle
  const isMessagesView = pathname?.startsWith("/messages");
  const currentView = isMessagesView ? "messages" : "waves";

  // Instead of calculating height, we'll use flex properties to fill parent container
  const sidebarStyle = useMemo(() => {
    const minHeight = "100%";
    return { minHeight };
  }, []);

  // Map enum values to label names
  const tabLabels: Record<MyStreamWaveTab, string> = {
    [MyStreamWaveTab.CHAT]: "Chat",
    [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
    [MyStreamWaveTab.WINNERS]: "Winners",
    [MyStreamWaveTab.OUTCOME]: "Outcome",
    [MyStreamWaveTab.MY_VOTES]: "My Votes",
    [MyStreamWaveTab.FAQ]: "FAQ",
  };

  // Generate options based on available tabs
  const contentFilterOptions = useMemo(() => {
    return availableTabs.map((tab) => ({
      key: tab,
      label: tabLabels[tab],
    }));
  }, [availableTabs, tabLabels]);

  return (
    <div
      ref={scrollContainerRef}
      className="tw-flex-shrink-0 tw-flex tw-flex-col tw-overflow-y-auto lg:tw-w-80 tw-w-full tw-h-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw"
      style={sidebarStyle}>
      <div className="tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0 tw-gap-y-4 tw-flex-col tw-flex tw-pt-4">
        <BrainLeftSidebarViewChange />

        {activeWaveId && contentFilterOptions.length > 1 && (
          <div className="tw-w-full tw-hidden">
            <TabToggle
              options={contentFilterOptions}
              activeKey={activeContentTab}
              onSelect={(key) => setActiveContentTab(key as MyStreamWaveTab)}
              fullWidth={true}
            />
          </div>
        )}

        {/* Search field shared */}
        <BrainLeftSidebarSearchWave listType={currentView} />

        <div className="tw-flex tw-flex-col tw-gap-y-2">
          {/* URL-based content rendering - NO TabToggle */}
          {currentView === "waves" && (
            <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
          )}
          {currentView === "messages" && (
            <DirectMessagesList scrollContainerRef={scrollContainerRef} />
          )}
        </div>
      </div>
    </div>
  );
};

export default WebLeftSidebar;