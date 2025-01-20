import React from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import BrainLeftSidebarCreateAWaveButton from "../left-sidebar/BrainLeftSidebarCreateAWaveButton";
import BrainLeftSidebarSearchWave from "../left-sidebar/search-wave/BrainLeftSidebarSearchWave";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

interface BrainMobileWavesProps {
  readonly activeWaveId: string;
}

const BrainMobileWaves: React.FC<BrainMobileWavesProps> = ({ activeWaveId }) => {
  const capacitor = useCapacitor();

  const containerClassName = `tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 ${
    capacitor.isCapacitor ? " tw-pb-[calc(4rem+80px)]" : ""
  }`;

  const handleShare = async (waveId: string) => {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Check out this wave!',
        text: 'I found this interesting wave',
        url: `https://yourapp.com/waves/${waveId}`,
        dialogTitle: 'Share wave'
      })
    }
  }

  return (
    <div className={containerClassName}>
      <BrainLeftSidebarCreateAWaveButton />
      <BrainLeftSidebarSearchWave />
      <BrainLeftSidebarWaves activeWaveId={activeWaveId} />
    </div>
  );
};

export default BrainMobileWaves;
