import React from "react";

import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWave } from "@/hooks/useWave";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";

import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersTimeline } from "./WaveWinnersTimeline";


interface WaveWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  const {
    decisions: { multiDecision },
  } = useWave(wave);

  // Use layout context for container style
  const { winnersViewStyle } = useLayout();

  // Fetch data using decisions endpoint for all waves
  const { decisionPoints, isFetching: isDecisionsLoading } = useWaveDecisions({
    waveId: wave.id,
    enabled: true, // Always enabled now that we use it for both types
  });

  return (
    <div
      className="tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 lg:tw-space-y-6"
      style={winnersViewStyle}
    >
      {multiDecision ? (
        <WaveWinnersTimeline
          onDropClick={onDropClick}
          decisionPoints={decisionPoints}
          wave={wave}
          isLoading={isDecisionsLoading}
        />
      ) : (
        <div className="tw-mt-2 tw-flex-grow tw-space-y-2 tw-pb-6 lg:tw-pr-2">
          <WaveWinnersPodium
            onDropClick={onDropClick}
            winners={decisionPoints[0]?.winners ?? []}
            isLoading={isDecisionsLoading}
          />
          <WaveWinnersDrops
            wave={wave}
            onDropClick={onDropClick}
            winners={decisionPoints[0]?.winners ?? []}
            isLoading={isDecisionsLoading}
          />
        </div>
      )}
    </div>
  );
};
