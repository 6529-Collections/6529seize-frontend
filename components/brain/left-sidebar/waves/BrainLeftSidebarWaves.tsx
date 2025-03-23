import React from "react";
import BrainLeftSidebarWavesList from "./BrainLeftSidebarWavesList";
import RecentWavesList from "./recent/RecentWavesList";
import useWavesList from "../../../../hooks/useWavesList";

interface BrainLeftSidebarWavesProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  activeWaveId,
}) => {
  const { mainWaves, pinnedWaves } = useWavesList();
  return (
    <div>
      <RecentWavesList waves={pinnedWaves}/>
      <BrainLeftSidebarWavesList activeWaveId={activeWaveId} waves={mainWaves}/>
    </div>
  );
};

export default BrainLeftSidebarWaves;
