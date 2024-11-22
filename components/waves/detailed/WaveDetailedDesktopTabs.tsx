import React from "react";
import { WaveDetailedView } from "./WaveDetailed";

interface WaveDetailedDesktopTabsProps {
  readonly activeTab: WaveDetailedView;
  readonly setActiveTab: (tab: WaveDetailedView) => void;
}

export const WaveDetailedDesktopTabs: React.FC<WaveDetailedDesktopTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-primary-800/30 tw-inline-flex tw-rounded-lg tw-w-auto tw-gap-x-0.5">
      <div className={activeTab === WaveDetailedView.LEADERBOARD ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400/20 tw-to-primary-600/20" : "tw-p-[1px] tw-flex tw-rounded-lg"}>
        <button
          onClick={() => setActiveTab(WaveDetailedView.LEADERBOARD)}
          className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
            activeTab === WaveDetailedView.LEADERBOARD
              ? "tw-bg-primary-500/10 tw-text-primary-400"
              : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-500 desktop-hover:hover:tw-text-primary-400"
          }`}
        >
          Leaderboard
        </button>
      </div>
      <div className={activeTab === WaveDetailedView.CHAT ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400/20 tw-to-primary-600/20" : "tw-p-[1px] tw-flex tw-rounded-lg"}>
        <button
          onClick={() => setActiveTab(WaveDetailedView.CHAT)}
          className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
            activeTab === WaveDetailedView.CHAT
              ? "tw-bg-primary-500/10 tw-text-primary-400" 
              : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-500 desktop-hover:hover:tw-text-primary-400"
          }`}
        >
          Chat
        </button>
      </div>
    </div>
  );
};
