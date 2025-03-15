import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersTimeline } from "./WaveWinnersTimeline";
import { WaveWinnersTimelineLoading } from "./WaveWinnersTimelineLoading";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { useWaveDecisions } from "../../../hooks/waves/useWaveDecisions";
import { ContentView, useContentHeight } from "../../../hooks/useContentHeight";

interface WaveWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  const { isMultiDecisionWave } = useDecisionPoints(wave);
  
  // Check if this is the Memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  // Use the content height hook
  const { heightStyle, ready } = useContentHeight({
    view: ContentView.WINNERS,
    isMemesWave,
    componentId: `wave-winners-${wave.id}`
  });

  // Fetch data using decisions endpoint for all waves
  const { decisionPoints: decisionPoints, isFetching: isDecisionsLoading } =
    useWaveDecisions({
      wave,
      enabled: true, // Always enabled now that we use it for both types
    });

  return (
    <div className="tw-space-y-4 lg:tw-space-y-6 sm:tw-px-2 lg:tw-px-0">
      {isMultiDecisionWave ? (
        isDecisionsLoading ? (
          <WaveWinnersTimelineLoading />
        ) : (
          <WaveWinnersTimeline
            onDropClick={onDropClick}
            decisionPoints={decisionPoints}
            wave={wave}
            isLoading={isDecisionsLoading}
          />
        )
      ) : (
        <div className="tw-space-y-2 tw-mt-2 tw-pb-4 tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-flex-grow" style={heightStyle}>
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
