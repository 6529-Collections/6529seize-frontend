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
    <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-700 tw-inline-flex tw-rounded-lg tw-w-auto tw-gap-x-0.5">
      <div
        className={
          activeTab === WaveLeaderboardRightSidebarTab.VOTERS
            ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800"
            : "tw-p-[1px] tw-flex tw-rounded-lg"
        }
      >
        <button
          onClick={() => setActiveTab(WaveLeaderboardRightSidebarTab.VOTERS)}
          className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
            activeTab === WaveLeaderboardRightSidebarTab.VOTERS
              ? "tw-bg-iron-800 tw-text-iron-100"
              : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
          }`}
        >
          Top Voters
        </button>
      </div>
      <div
        className={
          activeTab === WaveLeaderboardRightSidebarTab.ACTIVITY
            ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800"
            : "tw-p-[1px] tw-flex tw-rounded-lg"
        }
      >
        <button
          onClick={() => setActiveTab(WaveLeaderboardRightSidebarTab.ACTIVITY)}
          className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
            activeTab === WaveLeaderboardRightSidebarTab.ACTIVITY
              ? "tw-bg-iron-800 tw-text-iron-100"
              : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
          }`}
        >
          Activity Log
        </button>
      </div>
    </div>
  </div>
  );
};
