import React from "react";
import BrainLeftSidebarCreateAWaveButton from "../left-sidebar/BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";

interface BrainMobileWavesProps {
  readonly activeWaveId: string | null;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({
  activeWaveId,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-10.75rem)] lg:tw-h-full tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
      <BrainLeftSidebarCreateAWaveButton />
      <BrainLeftSidebarSearchWave />
      <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
    </div>
  );
};

export default BrainMobileWaves;
