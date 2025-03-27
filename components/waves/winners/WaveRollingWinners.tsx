import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
import { WaveRollingWinnersLoading } from "./WaveRollingWinnersLoading";
import { WaveWinnersEmpty } from "./WaveWinnersEmpty";
import { WaveRollingWinnersItem } from "./WaveRollingWinnersItem";

interface WaveRollingWinnersProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly decisionPoints: ApiWaveDecision[];
  readonly wave: ApiWave;
  readonly isLoading: boolean;
}

export const WaveRollingWinners: React.FC<WaveRollingWinnersProps> = ({
  onDropClick,
  decisionPoints,
  wave,
  isLoading,
}) => {
  // Instead of a Set, use a single string to track the currently open item
  const [expandedPointId, setExpandedPointId] = useState<string | null>(() => {
    // Open the latest decision point (highest round number) by default
    const latestIndex = decisionPoints.length - 1;
    return decisionPoints.length > 0 ? `decision-point-${latestIndex}` : null;
  });
  
  const toggleExpanded = (pointId: string) => {
    setExpandedPointId((prevId) => {
      // If clicking the currently open item, close it (set to null)
      // Otherwise, open the clicked item and close any previously open item
      return prevId === pointId ? null : pointId;
    });
  };

  // Show loading skeleton when data is being fetched
  if (isLoading) {
    return <WaveRollingWinnersLoading />;
  }

  // Display message when no winners are available
  if (decisionPoints.length === 0) {
    return <WaveWinnersEmpty />;
  }

  return (
    <div className="tw-space-y-2 tw-mt-2 tw-pb-4 lg:tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
      {/* Reverse the display order to show latest rounds at the top */}
      {[...decisionPoints].reverse().map((point, index) => {
        // Calculate the actual index for the key and other uses
        const actualIndex = decisionPoints.length - 1 - index;
        
        return (
          <WaveRollingWinnersItem
            key={`decision-point-${actualIndex}`}
            point={point}
            index={actualIndex}
            totalRounds={decisionPoints.length}
            isExpanded={expandedPointId === `decision-point-${actualIndex}`}
            toggleExpanded={() => toggleExpanded(`decision-point-${actualIndex}`)}
            onDropClick={onDropClick}
            wave={wave}
          />
        );
      })}
    </div>
  );
};
