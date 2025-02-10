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
    <div className="lg:tw-hidden tw-inline-flex tw-w-full tw-justify-between">
      <SingleWaveDropTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <SingleWaveDropClose onClose={onClose} />
    </div>
  );
}; 