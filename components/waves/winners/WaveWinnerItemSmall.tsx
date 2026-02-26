import { memo } from "react";

import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWave } from "@/hooks/useWave";

import { DefaultWaveWinnerDropSmall } from "./DefaultWaveWinnerDropSmall";
import { MemesWaveWinnerDropSmall } from "./MemesWaveWinnerDropSmall";

interface WaveWinnerItemSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
  readonly wave: ApiWave;
  readonly rank?: number | undefined; // For explicitly setting rank from decision winners
}

export const WaveWinnerItemSmall = memo<WaveWinnerItemSmallProps>(
  ({ drop, onDropClick, wave, rank }) => {
    const { isMemesWave } = useWave(wave);

    if (isMemesWave) {
      return (
        <MemesWaveWinnerDropSmall
          drop={drop}
          onDropClick={onDropClick}
          rank={rank}
        />
      );
    }
    return (
      <DefaultWaveWinnerDropSmall
        drop={drop}
        onDropClick={onDropClick}
        rank={rank}
      />
    );
  }
);

WaveWinnerItemSmall.displayName = "WaveWinnerItemSmall";
