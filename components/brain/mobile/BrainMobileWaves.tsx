import React from "react";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import { useLayout } from "../my-stream/layout/LayoutContext";

interface BrainMobileWavesProps {
  readonly activeWaveId: string;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({
  activeWaveId,
}) => {
  const { mobileWavesViewStyle } = useLayout();

  // We'll use the mobileWavesViewStyle for capacitor spacing
  let containerClassName = `tw-overflow-y-auto tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2`;

  return (
    <div className={containerClassName} style={mobileWavesViewStyle}>
      <BrainLeftSidebarSearchWave />
      <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
    </div>
  );
};

export default BrainMobileWaves;
