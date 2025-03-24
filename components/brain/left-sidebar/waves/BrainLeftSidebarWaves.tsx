import React, { useEffect } from "react";
import BrainLeftSidebarWavesList from "./BrainLeftSidebarWavesList";
import RecentWavesList from "./recent/RecentWavesList";
import useWavesList from "../../../../hooks/useWavesList";
import { useRouter } from "next/router";

interface BrainLeftSidebarWavesProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  activeWaveId,
}) => {
  const router = useRouter();
  const { mainWaves, pinnedWaves, addPinnedWave } = useWavesList();

  useEffect(() => {
    const { wave } = router.query;
    if (wave && typeof wave === "string") {
      addPinnedWave(wave);
    }
  }, [router.query, addPinnedWave]);

  return (
    <div>
      <RecentWavesList waves={pinnedWaves}/>
      <BrainLeftSidebarWavesList activeWaveId={activeWaveId} waves={mainWaves}/>
    </div>
  );
};

export default BrainLeftSidebarWaves;
