import React from "react";
import { TabToggle } from "../../common/TabToggle";
import { ApiWave } from "../../../generated/models/ApiWave";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { useContentTab } from "../ContentTabContext";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
}

interface TabOption {
  key: MyStreamWaveTab;
  label: string;
}

const MyStreamWaveDesktopTabs: React.FC<MyStreamWaveDesktopTabsProps> = ({
  activeTab,
  wave,
  setActiveTab,
}) => {
  // Use the available tabs from context instead of recalculating
  const { availableTabs } = useContentTab();
  
  // Check if this is a memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  // Check if this is a wave with at least one decision point
  const hasDecisionPoints = !!wave.wave.decisions_strategy?.first_decision_time;
  
  // Check if this is a multi-decision wave (with subsequent decisions)
  const hasMultipleDecisions = 
    !!wave.wave.decisions_strategy?.subsequent_decisions && 
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;
  
  // Check if this is a rolling wave
  const isRollingWave = 
    !!wave.wave.decisions_strategy?.is_rolling;
  
  // Determine if this is a "simple wave" (no decision points at all, not rolling, not memes)
  // Simple waves shouldn't show tabs at all
  const isSimpleWave = !hasDecisionPoints && !hasMultipleDecisions && !isRollingWave && !isMemesWave;
  
  // For simple waves, don't render any tabs
  if (isSimpleWave) {
    return null;
  }
  
  // Map enum values to label names
  const tabLabels: Record<MyStreamWaveTab, string> = {
    [MyStreamWaveTab.CHAT]: "Chat",
    [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
    [MyStreamWaveTab.WINNERS]: "Winners",
    [MyStreamWaveTab.OUTCOME]: "Outcome",
  };
  
  // Generate options based on available tabs
  const options: TabOption[] = availableTabs.map(tab => ({
    key: tab,
    label: tabLabels[tab]
  }));

  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-justify-between tw-w-full">
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as MyStreamWaveTab)}
      />
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
