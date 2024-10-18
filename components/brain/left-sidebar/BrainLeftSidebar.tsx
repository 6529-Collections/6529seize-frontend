import React from "react";
import { BrainLeftSidebarViewChange } from "./BrainLeftSidebarViewChange";
import BrainLeftSidebarCreateAWaveButton from "./BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "./search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "./waves/BrainLeftSidebarWaves";

const BrainLeftSidebar: React.FC = () => {
  return (
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-6.25rem)] tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
      <div className="tw-py-8 tw-flex-1">
        <BrainLeftSidebarViewChange />
        <BrainLeftSidebarCreateAWaveButton />
        <BrainLeftSidebarSearchWave />
        <BrainLeftSidebarWaves />
      </div>
    </div>
  );
};

export default BrainLeftSidebar;
