import React from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersTimeline } from "./WaveWinnersTimeline";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { useWave } from "@/hooks/useWave";

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
    wave,
    enabled: true, // Always enabled now that we use it for both types
  });

  return (
    <div
      className="tw-space-y-4 lg:tw-space-y-6 tw-px-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
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
        <div className="tw-space-y-2 tw-mt-2 tw-pb-6 lg:tw-pr-2 tw-flex-grow">
          <WaveWinnersPodium
            onDropClick={onDropClick}
            winners={decisionPoints[0]?.winners || []}
            isLoading={isDecisionsLoading}
          />
          <WaveWinnersDrops
            wave={wave}
            onDropClick={onDropClick}
            winners={decisionPoints[0]?.winners || []}
            isLoading={isDecisionsLoading}
          />
        </div>
      )}
    </div>
  );
};
