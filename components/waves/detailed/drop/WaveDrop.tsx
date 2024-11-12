import React from "react";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";

interface WaveDropProps {
  readonly wave: ApiWave;
}

export const WaveDrop: React.FC<WaveDropProps> = ({ wave }) => {
  return (
    <div>
      drop
    </div>
  );
};
