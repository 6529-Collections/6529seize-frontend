import React from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";

interface BrainMobileWavesProps {
  readonly activeWaveId: string;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({
  activeWaveId,
}) => {
  const capacitor = useCapacitor();

  const containerClassName = `tw-h-[calc(100vh-9.5rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2 ${
    capacitor.isIos
      ? "tw-pb-[calc(4rem+80px)]"
      : capacitor.isAndroid && !capacitor.keyboardVisible
      ? "tw-pb-[70px]"
      : ""
  }`;

  return (
    <div className={containerClassName}>
      <BrainLeftSidebarSearchWave />
      <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
    </div>
  );
};

export default BrainMobileWaves;
