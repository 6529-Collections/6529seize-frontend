import React from "react";
import BrainLeftSidebarCreateAWaveButton from "../left-sidebar/BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";

interface BrainMobileWavesProps {}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = () => {
  return (
    <div className="tw-flex tw-flex-col h-screen lg:tw-h-[calc(100vh-6.25rem)] tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
      <div className="tw-py-8 tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0">
        <BrainLeftSidebarCreateAWaveButton />
        <BrainLeftSidebarSearchWave />
        <BrainLeftSidebarWaves />
      </div>
    </div>
  );
};

export default BrainMobileWaves;
