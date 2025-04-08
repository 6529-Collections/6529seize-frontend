import React from "react";
import { MinimalWave } from "../../../../contexts/wave/MyStreamContext";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";

interface UnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
}

const UnifiedWavesListWaves: React.FC<UnifiedWavesListWavesProps> = ({
  waves,
}) => {
  if (!waves.length) {
    return null;
  }
  return (
    <div className="tw-flex tw-flex-col">
      {waves.map((wave) => (
        <div key={wave.id}>
          <BrainLeftSidebarWave wave={wave} />
        </div>
      ))}
    </div>
  );
};

export default UnifiedWavesListWaves;
