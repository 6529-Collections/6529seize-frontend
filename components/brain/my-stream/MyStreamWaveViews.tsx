import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { MyStreamWaveTab } from "./MyStreamWaveTabs";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import { WaveLeaderboard } from "../../waves/detailed/leaderboard/WaveLeaderboard";
import { WaveOutcome } from "../../waves/detailed/outcome/WaveOutcome";

interface MyStreamWaveViewsProps {
  readonly wave: ApiWave;
  readonly activeTab: MyStreamWaveTab;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveViews: React.FC<MyStreamWaveViewsProps> = ({
  wave,
  activeTab,
  onDropClick,
}) => {
  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: (
      <MyStreamWaveChat waveId={wave.id} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.LEADERBOARD]: (
      <WaveLeaderboard wave={wave} setActiveDrop={onDropClick}>
        <div></div>
      </WaveLeaderboard>
    ),
    [MyStreamWaveTab.OUTCOME]: (
      <WaveOutcome wave={wave}>
        <div></div>
      </WaveOutcome>
    ),
  };
  return components[activeTab];
};

export default MyStreamWaveViews;
