import React, { useState, useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";

export interface DecisionPoint {
  id: string;
  date: Date;
  label: string;
  rank: number;
}

interface WaveRollingWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly decisionPoints?: DecisionPoint[];
}

export const WaveRollingWinners: React.FC<WaveRollingWinnersProps> = ({
  wave,
  onDropClick,
  decisionPoints = [],
}) => {
  // Helper to check if a decision point is in the future (used for filtering)
  const isUpcoming = (point: DecisionPoint) => {
    return new Date(point.date) > new Date();
  };

  const mockDecisionPoints = useMemo<DecisionPoint[]>(() => {
    return decisionPoints.length > 0
      ? decisionPoints
      : [
          {
            id: "dp1",
            date: new Date(2023, 5, 15),
            label: "Winner Announcement",
            rank: 1,
          },
          {
            id: "dp2",
            date: new Date(2023, 5, 22),
            label: "Winner Announcement",
            rank: 2,
          },
          {
            id: "dp3",
            // Create a future date to test upcoming feature
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days in the future
            label: "Winner Announcement",
            rank: 3,
          },
        ];
  }, [decisionPoints]);

  // Filter to show only past winners and sort them
  const sortedDecisionPoints = useMemo(() => {
    const pastWinners = [...mockDecisionPoints].filter(
      (point) => !isUpcoming(point)
    );
    return pastWinners.sort((a, b) => b.rank - a.rank);
  }, [mockDecisionPoints]);

  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());

  // Open the first item by default only on first render
  React.useEffect(() => {
    if (sortedDecisionPoints.length > 0 && expandedPoints.size === 0) {
      setExpandedPoints(new Set([sortedDecisionPoints[0]?.id]));
    }
  }, []);

  const toggleExpanded = (pointId: string) => {
    setExpandedPoints((prev) => {
      const newSet = new Set(prev);
      newSet.has(pointId) ? newSet.delete(pointId) : newSet.add(pointId);
      return newSet;
    });
  };

  return (
    <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
      {sortedDecisionPoints.map((point, index) => (
        <div
          key={point.id}
          className="tw-rounded-lg tw-bg-iron-900 tw-border tw-border-iron-800"
        >
          <button
            onClick={() => toggleExpanded(point.id)}
            className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-bg-iron-900 hover:tw-bg-iron-800/50 tw-transition-colors tw-rounded-xl tw-group tw-border-0"
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <div
                className="tw-flex-shrink-0 tw-size-6 tw-rounded-md tw-bg-iron-800 
                  tw-flex tw-items-center tw-justify-center"
              >
                <span className={`tw-text-xs tw-font-medium ${index === 0 ? "tw-text-primary-400" : "tw-text-iron-400"}`}>
                  {point.rank}
                </span>
              </div>

              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm tw-font-medium tw-text-white/90">
                  Winner Announcement
                </span>

                <span className="tw-text-xs tw-text-iron-400 tw-ml-2">
                  {format(new Date(point.date), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="tw-flex tw-items-center">
              <div
                className={`tw-h-7 tw-w-7 tw-rounded-full tw-flex tw-items-center tw-justify-center 
                  tw-bg-iron-800 tw-transition-all
                  ${
                    expandedPoints.has(point.id)
                      ? "tw-rotate-180 tw-bg-primary-900/50"
                      : ""
                  }`}
              >
                <svg
                  className="tw-size-4 tw-text-iron-300 tw-flex-shrink-0"
                  fill="none"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expandedPoints.has(point.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="tw-space-y-4 tw-bg-black tw-rounded-b-xl tw-border-t tw-border-iron-800">
                  <WaveWinnersPodium wave={wave} onDropClick={onDropClick} />
                  <WaveWinnersDrops wave={wave} onDropClick={onDropClick} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
