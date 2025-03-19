import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DefaultSingleWaveDrop } from "./DefaultSingleWaveDrop";
import { MemesSingleWaveDrop } from "./MemesSingleWaveDrop";

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
  const isMemesWave =
    initialDrop.wave.id.toLowerCase() ===
    "87eb0561-5213-4cc6-9ae6-06a3793a5e58";

  if (isMemesWave) {
    return <MemesSingleWaveDrop drop={initialDrop} onClose={onClose} />;
  }

  return <DefaultSingleWaveDrop drop={initialDrop} onClose={onClose} />;
};
