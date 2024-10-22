import React, { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import BrainLeftSidebarWavesList from "./BrainLeftSidebarWavesList";
import BrainLeftSidebarWavesMyWaves from "./BrainLeftSidebarWavesMyWaves";

interface BrainLeftSidebarWavesProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = ({
  activeWaveId,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  return (
    <div>
      <BrainLeftSidebarWavesList activeWaveId={activeWaveId} />
      {!!connectedProfile?.profile?.handle && !activeProfileProxy && (
        <BrainLeftSidebarWavesMyWaves
          activeWaveId={activeWaveId}
          identity={connectedProfile?.profile?.handle}
        />
      )}
    </div>
  );
};

export default BrainLeftSidebarWaves;
