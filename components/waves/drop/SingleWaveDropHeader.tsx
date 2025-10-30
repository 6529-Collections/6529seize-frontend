import React from "react";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { SingleWaveDropTabs } from "./SingleWaveDropTabs";
import { SingleWaveDropClose } from "./SingleWaveDropClose";

interface SingleWaveDropHeaderProps {
  readonly activeTab: SingleWaveDropTab;
  readonly setActiveTab: (tab: SingleWaveDropTab) => void;
  readonly onClose: () => void;
}

export const SingleWaveDropHeader: React.FC<SingleWaveDropHeaderProps> = ({
  activeTab,
  setActiveTab,
  onClose,
}) => {
  return (
    <div className="lg:tw-hidden tw-inline-flex tw-w-full tw-justify-between tw-items-center tw-relative tw-px-4 tw-pt-[env(safe-area-inset-top,0px)] tw-gap-3">
      <SingleWaveDropTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <SingleWaveDropClose onClose={onClose} />
    </div>
  );
}; 
