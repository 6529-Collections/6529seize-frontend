import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { TabToggle } from "../../common/TabToggle";

interface MyStreamWaveTabsProps {
  readonly wave: ApiWave;
  readonly activeTab: MyStreamWaveTab;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
}

export enum MyStreamWaveTab {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  OUTCOME = "OUTCOME",
}

export const MyStreamWaveTabs: React.FC<MyStreamWaveTabsProps> = ({
  activeTab,
  setActiveTab,
  wave,
}) => {
  const { votingState } = useWaveState(wave);
  const options = [
    { key: MyStreamWaveTab.CHAT, label: "Chat" },
    {
      key: MyStreamWaveTab.LEADERBOARD,
      label: votingState === WaveVotingState.ENDED ? "Winners" : "Leaderboard",
    },
    { key: MyStreamWaveTab.OUTCOME, label: "Outcome" },
  ] as const;
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

export default MyStreamWaveTabs;
