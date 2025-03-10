import React from "react";

import { WaveLeaderboardRightSidebarTab } from "./WaveLeaderboardRightSidebar";

interface WaveLeaderboardRightSidebarTabsProps {
  readonly activeTab: WaveLeaderboardRightSidebarTab;
  readonly setActiveTab: (tab: WaveLeaderboardRightSidebarTab) => void;
}

export const WaveLeaderboardRightSidebarTabs: React.FC<WaveLeaderboardRightSidebarTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="tw-px-4 tw-pt-4">
      <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950/90 tw-ring-primary-800/20 tw-inline-flex tw-rounded-md tw-w-auto tw-gap-x-0.5">
        <div
          className={
            activeTab === WaveLeaderboardRightSidebarTab.VOTERS
              ? "tw-p-[1px] tw-flex tw-rounded-md tw-bg-gradient-to-b tw-from-primary-500/20 tw-to-primary-600/20"
              : "tw-p-[1px] tw-flex tw-rounded-md"
          }
        >
          <button
            onClick={() => setActiveTab(WaveLeaderboardRightSidebarTab.VOTERS)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-md tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveLeaderboardRightSidebarTab.VOTERS
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            Top Voters
          </button>
        </div>
        <div
          className={
            activeTab === WaveLeaderboardRightSidebarTab.ACTIVITY
              ? "tw-p-[1px] tw-flex tw-rounded-md tw-bg-gradient-to-b tw-from-primary-500/20 tw-to-primary-600/20"
              : "tw-p-[1px] tw-flex tw-rounded-md"
          }
        >
          <button
            onClick={() => setActiveTab(WaveLeaderboardRightSidebarTab.ACTIVITY)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-md tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveLeaderboardRightSidebarTab.ACTIVITY
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            Activity Log
          </button>
        </div>
      </div>
    </div>
  );
};
