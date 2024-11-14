import React from "react";
import { motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ObjectSerializer";
import { WaveDetailedOutcomes } from "./outcome/WaveDetailedOutcomes";
import { WaveDetailedSmallLeaderboard } from "./small-leaderboard/WaveDetailedSmallLeaderboard";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useState } from "react";

interface WaveDetailedRightSidebarProps {
  readonly isOpen: boolean;
  readonly wave: ApiWave;
  readonly onToggle: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const WaveDetailedRightSidebar: React.FC<WaveDetailedRightSidebarProps> = ({
  isOpen,
  wave,
  onToggle,
  onDropClick,
}) => {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "outcomes">("leaderboard");

  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950 tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem] tw-border-solid tw-border-l-2 tw-border-iron-800 tw-border-y-0 tw-border-b-0 tw-border-r-0"
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggle}
        className="tw-border-0 tw-absolute tw-left-2 lg:-tw-left-7 tw-z-50 tw-top-[7.5rem] tw-text-iron-500 hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-800 tw-rounded-r-lg lg:tw-rounded-r-none tw-rounded-l-lg tw-size-7 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          aria-hidden="true"
          stroke="currentColor"
          className="tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-300 tw-ease-in-out"
          animate={{ rotate: isOpen ? 0 : 180 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </motion.svg>
      </button>
      <div className="tw-pt-[5.6rem] xl:tw-pt-[6.25rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto horizontal-menu-hide-scrollbar tw-h-full">
        <div className="tw-px-4 tw-pt-4">
          <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-700 tw-inline-flex tw-rounded-lg tw-gap-x-0.5">
            <div
              className={
                activeTab === "leaderboard"
                  ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800 tw-flex-1"
                  : "tw-p-[1px] tw-flex tw-rounded-lg tw-flex-1"
              }
            >
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
                  activeTab === "leaderboard"
                    ? "tw-bg-iron-800 tw-text-iron-100"
                    : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
                }`}
              >
                Leaderboard
              </button>
            </div>
            <div
              className={
                activeTab === "outcomes"
                  ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800 tw-flex-1"
                  : "tw-p-[1px] tw-flex tw-rounded-lg tw-flex-1"
              }
            >
              <button
                onClick={() => setActiveTab("outcomes")}
                className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
                  activeTab === "outcomes"
                    ? "tw-bg-iron-800 tw-text-iron-100"
                    : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
                }`}
              >
                Outcome
              </button>
            </div>
          </div>
        </div>
        <div className="tw-h-full">
          {activeTab === "leaderboard" ? (
            <WaveDetailedSmallLeaderboard wave={wave} onDropClick={onDropClick} />
          ) : (
            <WaveDetailedOutcomes wave={wave} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WaveDetailedRightSidebar;
