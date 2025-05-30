import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DefaultSingleWaveDrop } from "./DefaultSingleWaveDrop";
import { MemesSingleWaveDrop } from "./MemesSingleWaveDrop";
import { useSeizeSettings } from "../../../contexts/SeizeSettingsContext";

interface SingleWaveDropProps {
  readonly drop: ExtendedDrop;
  readonly onClose: () => void;
}

export enum SingleWaveDropTab {
  INFO = "INFO",
  CHAT = "CHAT",
}

export const SingleWaveDrop: React.FC<SingleWaveDropProps> = ({
  drop: initialDrop,
  onClose,
}) => {
  // Check if this is the memes wave
  const { isMemesWave } = useSeizeSettings();
  const isMemes = isMemesWave(initialDrop.wave.id);

  if (isMemes) {
    return <MemesSingleWaveDrop drop={initialDrop} onClose={onClose} />;
  }

  return <DefaultSingleWaveDrop drop={initialDrop} onClose={onClose} />;
};
