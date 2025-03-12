import React from "react";
import { BrainLeftSidebarViewChange } from "./BrainLeftSidebarViewChange";
import BrainLeftSidebarSearchWave from "./search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "./waves/BrainLeftSidebarWaves";
import { useElectron } from "../../../hooks/useElectron";

interface BrainLeftSidebarProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebar: React.FC<BrainLeftSidebarProps> = ({
  activeWaveId,
}) => {
  const isElectron = useElectron();
  const heightClass = isElectron
    ? "lg:tw-h-[calc(100vh-7.5rem)]"
    : "lg:tw-h-[calc(100vh-5.5rem)]";

  return (
    <div
      className={`${heightClass} tw-flex-shrink-0 tw-relative tw-flex tw-flex-col h-screen tw-overflow-y-auto lg:tw-w-80 tw-w-full no-scrollbar`}>
      <div className="tw-pt-4 tw-pb-4 tw-flex-1 tw-px-4 md:tw-px-2 lg:tw-px-0 tw-gap-y-4 tw-flex-col tw-flex">
        <BrainLeftSidebarViewChange />
        <BrainLeftSidebarSearchWave />
        <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
      </div>
    </div>
  );
};

export default BrainLeftSidebar;
