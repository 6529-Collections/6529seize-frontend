import React from "react";
import { BrainLeftSidebarViewChange } from "./BrainLeftSidebarViewChange";
import BrainLeftSidebarCreateAWaveButton from "./BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "./search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "./waves/BrainLeftSidebarWaves";

interface BrainLeftSidebarProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebar: React.FC<BrainLeftSidebarProps> = ({
  activeWaveId,
}) => {
  return (
    <div className="tw-flex-shrink-0 tw-relative tw-flex tw-flex-col h-screen lg:tw-h-[calc(100vh-5.5rem)] tw-overflow-y-auto lg:tw-w-[20.5rem] tw-w-full no-scrollbar">
      <div className="tw-pt-4 tw-pb-4 tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0">
        <BrainLeftSidebarViewChange />
        <BrainLeftSidebarCreateAWaveButton />
        <BrainLeftSidebarSearchWave />
        <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
      </div>
    </div>
  );
};

export default BrainLeftSidebar;
