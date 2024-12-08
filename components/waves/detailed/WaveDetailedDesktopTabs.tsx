import React from "react";
import { WaveDetailedView } from "./WaveDetailed";
import { TabToggle } from "../../common/TabToggle";

interface WaveDetailedDesktopTabsProps {
  readonly activeTab: WaveDetailedView;
  readonly setActiveTab: (tab: WaveDetailedView) => void;
}

export const WaveDetailedDesktopTabs: React.FC<WaveDetailedDesktopTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const options = [
    { key: WaveDetailedView.CHAT, label: "Chat" },
    { key: WaveDetailedView.LEADERBOARD, label: "Leaderboard" },
  ] as const;

  return (
    <TabToggle
      options={options}
      activeKey={activeTab}
      onSelect={(key) => setActiveTab(key as WaveDetailedView)}
    />
  );
};
