import React, { memo } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWave } from "../../../hooks/useWave";
import { MemesWaveWinnerDropSmall } from "./MemesWaveWinnerDropSmall";
import { DefaultWaveWinnerDropSmall } from "./DefaultWaveWinnerDropSmall";

interface WaveWinnerItemSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
  readonly rank?: number; // For explicitly setting rank from decision winners
}

export const WaveWinnerItemSmall = memo<WaveWinnerItemSmallProps>(
  ({ drop, onDropClick, wave, rank }) => {
    const { isMemesWave } = useWave(wave);

    if (isMemesWave) {
      return (
        <MemesWaveWinnerDropSmall
          drop={drop}
          onDropClick={onDropClick}
          wave={wave}
          rank={rank}
        />
      );
    } else {
      return (
        <DefaultWaveWinnerDropSmall
          drop={drop}
          onDropClick={onDropClick}
          wave={wave}
          rank={rank}
        />
      );
    }
  }
);

WaveWinnerItemSmall.displayName = "WaveWinnerItemSmall";
