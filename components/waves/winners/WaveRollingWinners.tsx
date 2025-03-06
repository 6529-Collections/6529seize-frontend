import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";

interface WaveRollingWinnersProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly decisionPoints: ApiWaveDecision[];
  readonly wave: ApiWave;
}

export const WaveRollingWinners: React.FC<WaveRollingWinnersProps> = ({
  onDropClick,
  decisionPoints,
  wave,
}) => {
  // Initialize with the first accordion item open by default
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(() => {
    // When there are decision points, open the first one by default
    return new Set(decisionPoints.length > 0 ? ['decision-point-0'] : []);
  });
  const toggleExpanded = (pointId: string) => {
    setExpandedPoints((prev) => {
      const newSet = new Set(prev);
      newSet.has(pointId) ? newSet.delete(pointId) : newSet.add(pointId);
      return newSet;
    });
  };

  // Display message when no decision points are available
  if (decisionPoints.length === 0) {
    return (
      <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
        <div className="tw-p-6 tw-text-center tw-bg-iron-900 tw-rounded-lg tw-border tw-border-iron-800">
          <div className="tw-h-14 tw-w-14 tw-mx-auto tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-bg-iron-800/80 tw-mb-4">
            <svg
              className="tw-mx-auto tw-flex-shrink-0 tw-h-7 tw-w-7 tw-text-iron-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
            >
              <path
                fill="currentColor"
                d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0z"
              />
            </svg>
          </div>
          <p className="tw-text-lg tw-font-semibold tw-text-iron-300">
            No Decision Points Available
          </p>
          <p className="tw-text-sm tw-text-iron-400 tw-mt-2">
            There are no past decision points to display for this wave.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
      {decisionPoints.map((point, index) => (
        <div
          key={`decision-point-${index}`}
          className="tw-rounded-lg tw-bg-iron-900 tw-border tw-border-iron-800"
        >
          <button
            onClick={() => toggleExpanded(`decision-point-${index}`)}
            className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-bg-iron-900 hover:tw-bg-iron-800/50 tw-transition-colors tw-rounded-xl tw-group tw-border-0"
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <div
                className="tw-flex-shrink-0 tw-size-6 tw-rounded-md tw-bg-iron-800 
                  tw-flex tw-items-center tw-justify-center"
              >
                <span
                  className={`tw-text-xs tw-font-medium ${
                    index === 0 ? "tw-text-primary-400" : "tw-text-iron-400"
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              <div className="tw-flex tw-items-center">
                <span className="tw-text-sm tw-font-medium tw-text-white/90">
                  {`Winner Announcement`}
                </span>

                <span className="tw-text-xs tw-text-iron-400 tw-ml-2">
                  {format(new Date(point.decision_time), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="tw-flex tw-items-center">
              <div
                className={`tw-h-7 tw-w-7 tw-rounded-full tw-flex tw-items-center tw-justify-center 
                  tw-bg-iron-800 tw-transition-all
                  ${
                    expandedPoints.has(`decision-point-${index}`)
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
            {expandedPoints.has(`decision-point-${index}`) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="tw-space-y-4 tw-bg-black tw-rounded-b-xl tw-border-t tw-border-iron-800">
                  <WaveWinnersPodium
                    onDropClick={onDropClick}
                    winners={point.winners}
                    isLoading={false}
                  />
                  <WaveWinnersDrops
                    onDropClick={onDropClick}
                    winners={point.winners}
                    isLoading={false}
                    wave={wave}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
