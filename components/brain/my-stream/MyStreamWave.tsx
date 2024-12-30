import React, { useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import MyStreamWaveTabs, { MyStreamWaveTab } from "./MyStreamWaveTabs";
import { useWaveData } from "../../../hooks/useWaveData";
import MyStreamWaveViews from "./MyStreamWaveViews";
import { useWaveState } from "../../../hooks/useWaveState";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";

interface MyStreamWaveProps {
  readonly waveId: string;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId, onDropClick }) => {
  const [activeTab, setActiveTab] = useState<MyStreamWaveTab>(
    MyStreamWaveTab.CHAT
  );
  const { data: wave } = useWaveData(waveId);
  const isDropsWave = wave?.wave.type !== ApiWaveType.Chat;
  if (!wave) {
    return null;
  }

  return (
    <div>
      {isDropsWave && (
        <MyStreamWaveTabs
          wave={wave}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      <MyStreamWaveViews
        wave={wave}
        activeTab={activeTab}
        onDropClick={onDropClick}
      />
    </div>
  );
};

export default MyStreamWave;
