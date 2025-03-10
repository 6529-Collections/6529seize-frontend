import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
import { WaveWinnersEmpty } from "./WaveWinnersEmpty";
import { WaveWinnersTimelineItem } from "./WaveWinnersTimelineItem";
import { format } from "date-fns";

interface WaveWinnersTimelineProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly decisionPoints: ApiWaveDecision[];
  readonly wave: ApiWave;
  readonly isLoading: boolean;
}

export const WaveWinnersTimeline: React.FC<WaveWinnersTimelineProps> = ({
  onDropClick,
  decisionPoints,
  wave,
  isLoading,
}) => {
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);

  const toggleExpanded = (pointId: string) => {
    setExpandedPointId((prevId) => {
      return prevId === pointId ? null : pointId;
    });
  };

  // Display message when no winners are available
  if (decisionPoints.length === 0) {
    return <WaveWinnersEmpty />;
  }

  // Group decision points by date for better visual organization
  const groupedByDate: Record<string, ApiWaveDecision[]> = {};

  // Using original array
  [...decisionPoints].forEach((point, index) => {
    const dateKey = format(new Date(point.decision_time), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(point);
  });

  return (
    <div className="tw-mt-2 tw-pb-4 tw-max-h-[calc(100vh-148px)] min-[1200px]:tw-max-h-[calc(100vh-160px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-bg-black">
      <div className="tw-relative">
        {/* Timeline vertical line */}
        <div className="tw-absolute tw-left-[19px] tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-700/80 tw-backdrop-blur-sm"></div>
        {/* Timeline glow effect */}
        <div className="tw-absolute tw-left-[18px] tw-top-0 tw-bottom-0 tw-w-[3px] tw-bg-gradient-to-b tw-from-iron-900 tw-via-iron-700/20 tw-to-iron-900 tw-opacity-40 tw-blur-sm"></div>

        <div className="tw-space-y-8">
          {/* Render decision points by date groups - sorted with newest dates first */}
          {Object.entries(groupedByDate)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([dateKey, points], groupIndex) => {
              const formattedDate = format(
                new Date(dateKey),
                "EEE, MMM d, yyyy"
              );

              return (
                <div key={dateKey} className="tw-relative">
                  {/* Date header */}
                  <div className="tw-mb-4 tw-flex tw-items-center tw-ml-3.5">
                    <div className="tw-relative">
                      <div className="tw-size-2.5 tw-rounded-full tw-bg-iron-600 tw-mr-4 tw-z-10 tw-relative"></div>
                      <div className="tw-absolute tw-top-0 tw-left-0 tw-size-2.5 tw-rounded-full tw-bg-iron-500 tw-opacity-40 tw-blur-[2px]"></div>
                    </div>
                    <h3 className="tw-text-sm tw-text-iron-350 tw-font-medium tw-border-b tw-border-iron-700/40 tw-mb-0">
                      {formattedDate}
                    </h3>
                  </div>

                  <div className="tw-space-y-3 tw-ml-6">
                    {points.map((point) => {
                      // Use the original index to determine the round number
                      const roundIndex = decisionPoints.findIndex(
                        (p) => p.decision_time === point.decision_time
                      );
                      const roundNumber = roundIndex + 1; // +1 because rounds are 1-indexed
                      const nodeId = `decision-${point.decision_time}`;
                      const hasWinners = point.winners.length > 0;

                      return (
                        <WaveWinnersTimelineItem
                          key={nodeId}
                          point={point}
                          roundNumber={roundNumber}
                          isExpanded={expandedPointId === nodeId && hasWinners}
                          toggleExpanded={() =>
                            hasWinners && toggleExpanded(nodeId)
                          }
                          onDropClick={onDropClick}
                          wave={wave}
                          isInteractive={hasWinners}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
