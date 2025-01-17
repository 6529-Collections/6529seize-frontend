import React from "react";
import { TabToggle } from "../../common/TabToggle";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import { MyStreamWaveTab } from "./MyStreamWave";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
}

export const getWaveTabOptions = (votingState: WaveVotingState) => [
  { key: MyStreamWaveTab.CHAT, label: "Chat" },
  {
    key: MyStreamWaveTab.LEADERBOARD,
    label: votingState === WaveVotingState.ENDED ? "Winners" : "Leaderboard",
  },
  { key: MyStreamWaveTab.OUTCOME, label: "Outcome" },
] as const;

const MyStreamWaveDesktopTabs: React.FC<MyStreamWaveDesktopTabsProps> = ({
  activeTab,
  wave,
  setActiveTab,
}) => {
  const { votingState } = useWaveState(wave);
  const options = getWaveTabOptions(votingState);

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
