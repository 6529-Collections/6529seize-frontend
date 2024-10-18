import React, { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import BrainLeftSidebarWavesList from "./BrainLeftSidebarWavesList";
import BrainLeftSidebarWavesMyWaves from "./BrainLeftSidebarWavesMyWaves";

interface BrainLeftSidebarWavesProps {}

const BrainLeftSidebarWaves: React.FC<BrainLeftSidebarWavesProps> = () => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  return (
    <div>
      <BrainLeftSidebarWavesList />
      {!!connectedProfile?.profile?.handle && !activeProfileProxy && (
        <BrainLeftSidebarWavesMyWaves
          identity={connectedProfile?.profile?.handle}
        />
      )}
    </div>
  );
};

export default BrainLeftSidebarWaves;
