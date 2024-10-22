import React from "react";
import BrainLeftSidebarCreateAWaveButton from "../left-sidebar/BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";

interface BrainMobileWavesProps {}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = () => {
  return (
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-10.75rem)] lg:tw-h-full tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
      <BrainLeftSidebarCreateAWaveButton />
      <BrainLeftSidebarSearchWave />
      <BrainLeftSidebarWaves />
    </div>
  );
};

export default BrainMobileWaves;
