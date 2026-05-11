import { memo } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { MemesWaveWinnerDropSmall } from "./MemesWaveWinnerDropSmall";
import { DefaultWaveWinnerDropSmall } from "./DefaultWaveWinnerDropSmall";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";

interface WaveWinnerItemSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
  readonly wave: ApiWave;
  readonly rank?: number | undefined; // For explicitly setting rank from decision winners
  readonly contentPresentation?: DropContentPresentation | undefined;
}

export const WaveWinnerItemSmall = memo<WaveWinnerItemSmallProps>(
  ({ drop, onDropClick, wave, rank, contentPresentation = "default" }) => {
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
        contentPresentation={contentPresentation}
      />
    );
  }
);

WaveWinnerItemSmall.displayName = "WaveWinnerItemSmall";
