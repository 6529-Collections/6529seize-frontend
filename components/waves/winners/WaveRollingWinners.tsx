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
    // When there are decision points, open the first one by default
    return decisionPoints.length > 0 ? 'decision-point-0' : null;
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
    <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-none">
      {decisionPoints.map((point, index) => (
        <WaveRollingWinnersItem
          key={`decision-point-${index}`}
          point={point}
          index={index}
          isExpanded={expandedPointId === `decision-point-${index}`}
          toggleExpanded={() => toggleExpanded(`decision-point-${index}`)}
          onDropClick={onDropClick}
          wave={wave}
        />
      ))}
    </div>
  );
};
