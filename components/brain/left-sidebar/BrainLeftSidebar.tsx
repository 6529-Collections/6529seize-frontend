"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { BrainLeftSidebarViewChange } from "./BrainLeftSidebarViewChange";
import BrainLeftSidebarSearchWave from "./search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "./waves/BrainLeftSidebarWaves";
import { TabToggle } from "../../common/TabToggle";
import { useContentTab } from "../ContentTabContext";
import { MyStreamWaveTab } from "../../../types/waves.types";
import DirectMessagesList from "../direct-messages/DirectMessagesList";
import { useSearchParams } from "next/navigation";
import { useUnreadIndicator } from "../../../hooks/useUnreadIndicator";
import { useAuth } from "../../auth/Auth";
import { useWaveData } from "../../../hooks/useWaveData";
import { useWave } from "../../../hooks/useWave";

interface BrainLeftSidebarProps {
  readonly activeWaveId: string | null | undefined;
}

const BrainLeftSidebar: React.FC<BrainLeftSidebarProps> = ({
  activeWaveId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { connectedProfile } = useAuth();
  const searchParams = useSearchParams();

  // Get wave data to determine if it's a DM
  const { data: currentWave } = useWaveData({
    waveId: activeWaveId || null,
    onWaveNotFound: () => {},
  });
  const { isDm } = useWave(currentWave);

  // Get content tab state from context
  const { activeContentTab, setActiveContentTab, availableTabs } =
    useContentTab();

  const getContentFilterPanelId = (tab: MyStreamWaveTab): string =>
    `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

  const getSidebarTabPanelId = (tab: "waves" | "messages"): string =>
    `brain-left-sidebar-${tab}-panel`;

  // Sidebar tab state: 'waves' or 'messages'
  const [sidebarTab, setSidebarTab] = useState<"waves" | "messages">(() => {
    if (typeof window === "undefined") return "waves";
    return (
      (localStorage.getItem("sidebarTab") as "waves" | "messages") || "waves"
    );
  });

  // Auto-switch tab based on active wave type
  useEffect(() => {
    if (activeWaveId && currentWave) {
      if (isDm) {
        setSidebarTab("messages");
      } else {
        setSidebarTab("waves");
      }
    }
  }, [activeWaveId, isDm, currentWave]);

  // Get unread indicator for messages
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  // keep tab in sync with url ?view=
  const viewParam = searchParams?.get('view');
  useEffect(() => {
    if (viewParam === "messages") {
      setSidebarTab("messages");
    } else {
      // default to waves when param is 'waves' or absent
      setSidebarTab("waves");
    }
  }, [viewParam]);

  useEffect(() => {
    localStorage.setItem("sidebarTab", sidebarTab);
  }, [sidebarTab]);

  // Instead of calculating height, we'll use flex properties to fill parent container
  const sidebarStyle = useMemo(() => {
    // Since parent container has proper height constraint,
    // We can rely on flex properties to fill available space

    // Remove explicit height calculation
    // Use minHeight for safety but let parent container constrain
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
      panelId: getContentFilterPanelId(tab),
    }));
  }, [availableTabs, tabLabels]);

  // Create tab options with indicators
  const sidebarTabOptions = useMemo(
    () => [
      { key: "waves", label: "Waves", panelId: getSidebarTabPanelId("waves") },
      {
        key: "messages",
        label: "Messages",
        hasIndicator: hasUnreadMessages,
        panelId: getSidebarTabPanelId("messages"),
      },
    ],
    [hasUnreadMessages]
  );

  return (
    <div
      ref={scrollContainerRef}
      className="tw-flex-shrink-0 tw-flex tw-flex-col tw-overflow-y-auto lg:tw-w-80 tw-w-full tw-h-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden"
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
        <BrainLeftSidebarSearchWave listType={sidebarTab} />

        <div className="tw-flex tw-flex-col tw-gap-y-2">
          {/* Tab switcher with indicator support */}
          <TabToggle
            options={sidebarTabOptions}
            activeKey={sidebarTab}
            onSelect={(k) => setSidebarTab(k as "waves" | "messages")}
          />

          {sidebarTab === "waves" && (
            <div
              id={getSidebarTabPanelId("waves")}
              role="tabpanel"
              className="tw-w-full"
            >
              <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
            </div>
          )}
          {sidebarTab === "messages" && (
            <div
              id={getSidebarTabPanelId("messages")}
              role="tabpanel"
              className="tw-w-full"
            >
              <DirectMessagesList scrollContainerRef={scrollContainerRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrainLeftSidebar;
