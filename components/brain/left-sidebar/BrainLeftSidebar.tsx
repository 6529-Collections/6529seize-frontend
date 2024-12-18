import React from "react";
import { BrainLeftSidebarViewChange } from "./BrainLeftSidebarViewChange";
import BrainLeftSidebarCreateAWaveButton from "./BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "./search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "./waves/BrainLeftSidebarWaves";
import BrainContentPinnedWaves from "../content/BrainContentPinnedWaves";

interface BrainLeftSidebarProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebar: React.FC<BrainLeftSidebarProps> = ({
  activeWaveId,
}) => {
  return (
    <div className="tw-hidden lg:tw-flex tw-gap-4">
      <BrainContentPinnedWaves />
      <div className="tw-flex-shrink-0 tw-relative tw-flex tw-flex-col h-screen lg:tw-h-[calc(100vh-6.25rem)] tw-overflow-y-auto tw-w-[18rem] no-scrollbar">
        <div className="tw-pt-6 tw-pb-3 tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0">
          <BrainLeftSidebarViewChange />
          <BrainLeftSidebarCreateAWaveButton />
          <BrainLeftSidebarSearchWave />
          <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
        </div>
      </div>
    </div>
  );
};

export default BrainLeftSidebar;
