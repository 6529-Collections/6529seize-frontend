import React, { useState, useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { WaveWinnersDrop } from "./drops/WaveWinnersDrop";
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
  const mockDecisionPoints = useMemo<DecisionPoint[]>(() => {
    return decisionPoints.length > 0
      ? decisionPoints
      : [
          {
            id: "dp1",
            date: new Date(2023, 5, 15),
            label: "Decision Point",
            rank: 1,
          },
          {
            id: "dp2",
            date: new Date(2023, 5, 22),
            label: "Decision Point",
            rank: 2,
          },
          {
            id: "dp3",
            date: new Date(2023, 5, 29),
            label: "Decision Point",
            rank: 3,
          },
        ];
  }, [decisionPoints]);

  const sortedDecisionPoints = useMemo(() => {
    return [...mockDecisionPoints].sort((a, b) => b.rank - a.rank);
  }, [mockDecisionPoints]);

  const mostRecentPoint = sortedDecisionPoints[0];
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(
    new Set([mostRecentPoint?.id]) // Most recent is open by default
  );

  const toggleExpanded = (pointId: string) => {
    setExpandedPoints((prev) => {
      const newSet = new Set(prev);
      newSet.has(pointId) ? newSet.delete(pointId) : newSet.add(pointId);
      return newSet;
    });
  };

  const isMostRecent = (point: DecisionPoint) =>
    point.id === mostRecentPoint?.id;

  return (
    <div className="tw-space-y-2">
      {sortedDecisionPoints.map((point, index) => (
        <div
          key={point.id}
          className="tw-bg-iron-900 tw-rounded-xl"
        >
          <button
            onClick={() => toggleExpanded(point.id)}
            className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-bg-transparent tw-border-0 hover:tw-bg-iron-800/50 tw-transition-colors tw-group"
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <div
                className={`tw-h-7 tw-w-7 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-medium tw-transition-all
                    ${
                      isMostRecent(point)
                        ? "tw-bg-primary-600/20 tw-text-primary-400 tw-ring-1 tw-ring-primary-500/30"
                        : "tw-bg-iron-700 tw-text-iron-300 group-hover:tw-bg-iron-600 tw-ring-1 tw-ring-iron-700/30"
                    }`}
              >
                {point.rank}
              </div>
              <div className="tw-text-left">
                <span className="tw-text-base tw-font-medium tw-text-white">
                  Decision Point
                </span>
                <span className="tw-text-sm tw-text-iron-400 tw-ml-2">
                  {format(new Date(point.date), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <div
              className={`tw-h-7 tw-w-7 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-transition-all
                  ${
                    expandedPoints.has(point.id)
                      ? "tw-rotate-180 tw-bg-primary-900/50"
                      : "group-hover:tw-bg-iron-700/50"
                  }`}
            >
              <svg
                className="tw-h-5 tw-w-5 tw-text-iron-400 tw-flex-shrink-0"
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
