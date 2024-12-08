import React from "react";
import { WaveDropTabs } from "./WaveDropTabs";
import { WaveDropClose } from "./WaveDropClose";
import { WaveDropTab } from "./WaveDrop";

interface WaveDropHeaderProps {
  readonly activeTab: WaveDropTab;
  readonly setActiveTab: (tab: WaveDropTab) => void;
  readonly onClose: () => void;
}

export const WaveDropHeader: React.FC<WaveDropHeaderProps> = ({
  activeTab,
  setActiveTab,
  onClose,
}) => {
  return (
    <div className="lg:tw-hidden tw-inline-flex tw-w-full tw-justify-between">
      <WaveDropTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <WaveDropClose onClose={onClose} />
    </div>
  );
}; 
