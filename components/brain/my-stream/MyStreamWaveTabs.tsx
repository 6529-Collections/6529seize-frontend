import React, { useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { TabToggle } from "../../common/TabToggle";
import { MyStreamWaveTab } from "./MyStreamWave";

interface MyStreamWaveTabsProps {
  readonly wave: ApiWave;
  readonly activeTab: MyStreamWaveTab;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
}

interface TabOption {
  key: MyStreamWaveTab;
  label: string;
}

export const MyStreamWaveTabs: React.FC<MyStreamWaveTabsProps> = ({
  activeTab,
  setActiveTab,
  wave,
}) => {
  const { votingState, hasFirstDecisionPassed } = useWaveState(wave);
  
  // Generate tab options based on wave state
  const options = useMemo(() => {
    const tabs: TabOption[] = [
      { key: MyStreamWaveTab.CHAT, label: "Chat" }
    ];
    
    // Show Leaderboard tab always except when voting has ended
    if (votingState !== WaveVotingState.ENDED) {
      tabs.push({ key: MyStreamWaveTab.LEADERBOARD, label: "Leaderboard" });
    }
    
    // Show Winners tab if first decision has passed
    if (hasFirstDecisionPassed) {
      tabs.push({ key: MyStreamWaveTab.WINNERS, label: "Winners" });
    }
    
    // Always show Outcome tab
    tabs.push({ key: MyStreamWaveTab.OUTCOME, label: "Outcome" });
    
    return tabs;
  }, [votingState, hasFirstDecisionPassed]);
  
  return (
    <div className="tw-flex tw-items-center tw-gap-4 tw-justify-between tw-w-full tw-hidden">
      {/* Temporarily hide the tabs as they are now in the left sidebar */}
      <TabToggle
        options={options}
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as MyStreamWaveTab)}
      />
    </div>
  );
};

export default MyStreamWaveTabs;
