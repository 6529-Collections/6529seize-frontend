import React from "react";
import { WaveDropTab } from "./WaveDrop";

interface WaveDropTabsProps {
  readonly activeTab: WaveDropTab;
  readonly setActiveTab: (tab: WaveDropTab) => void;
}

export const WaveDropTabs: React.FC<WaveDropTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="lg:tw-hidden tw-w-full tw-px-4 tw-py-2 tw-bg-iron-950 tw-border-b tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-t-0">
      <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950/90 tw-ring-primary-800/20 tw-inline-flex tw-rounded-lg tw-w-auto tw-gap-x-0.5">
        <div
          className={
            activeTab === WaveDropTab.INFO
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-500/20 tw-to-primary-600/20"
              : "tw-p-[1px] tw-flex tw-rounded-lg"
          }
        >
          <button
            onClick={() => setActiveTab(WaveDropTab.INFO)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveDropTab.INFO
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            Drop
          </button>
        </div>
        <div
          className={
            activeTab === WaveDropTab.CHAT
              ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-500/20 tw-to-primary-600/20"
              : "tw-p-[1px] tw-flex tw-rounded-lg"
          }
        >
          <button
            onClick={() => setActiveTab(WaveDropTab.CHAT)}
            className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
              activeTab === WaveDropTab.CHAT
                ? "tw-bg-primary-500/10 tw-text-primary-300"
                : "tw-bg-iron-950 desktop-hover:hover:tw-bg-primary-500/5 tw-text-iron-400 desktop-hover:hover:tw-text-primary-300"
            }`}
          >
            Discussion
          </button>
        </div>
      </div>
    </div>
  );
};
