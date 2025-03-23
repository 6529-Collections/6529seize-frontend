import React from "react";
import BrainLeftSidebarWavesList from "./BrainLeftSidebarWavesList";
import RecentWavesList from "./recent/RecentWavesList";

interface BrainLeftSidebarWavesProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  activeWaveId,
}) => {
  return (
    <div>
      <RecentWavesList activeWaveId={activeWaveId}/>
      <BrainLeftSidebarWavesList activeWaveId={activeWaveId} />
    </div>
  );
};

export default BrainLeftSidebarWaves;
