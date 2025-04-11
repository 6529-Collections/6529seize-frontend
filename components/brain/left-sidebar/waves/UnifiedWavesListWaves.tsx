import React from "react";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";

interface UnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
}

const UnifiedWavesListWaves: React.FC<UnifiedWavesListWavesProps> = ({
  waves,
  onHover,
}) => {
  if (!waves.length) {
    return null;
  }
  return (
    <div className="tw-flex tw-flex-col">
      {waves.map((wave) => (
        <div key={wave.id}>
          <BrainLeftSidebarWave wave={wave} onHover={onHover} />
        </div>
      ))}
    </div>
  );
};

export default UnifiedWavesListWaves;
