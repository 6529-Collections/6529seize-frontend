import React, { useState } from "react";
import { motion } from "framer-motion";

interface WaveLeaderboardRightSidebarProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

type Tab = "voters" | "activity";

const WaveLeaderboardRightSidebar: React.FC<WaveLeaderboardRightSidebarProps> = ({ 
  isOpen, 
  onToggle 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("voters");

  return (
    <motion.div
      className="tw-fixed tw-right-0 tw-top-0 tw-h-screen tw-z-40 tw-bg-iron-950/95 tw-backdrop-blur-sm tw-flex tw-flex-col tw-w-full lg:tw-w-[20.5rem] tw-border-l tw-border-iron-800/50"
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggle}
        className="tw-border-0 tw-absolute tw-left-2 lg:-tw-left-7 tw-z-50 tw-top-[7.5rem] tw-text-iron-500 hover:tw-text-primary-400 tw-transition-all tw-duration-300 tw-ease-in-out tw-bg-iron-900/90 tw-backdrop-blur-sm tw-rounded-r-lg lg:tw-rounded-r-none tw-rounded-l-lg tw-size-7 tw-flex tw-items-center tw-justify-center tw-shadow-lg hover:tw-shadow-primary-400/20"
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
        <div className="tw-flex tw-bg-iron-900/50 tw-backdrop-blur-sm tw-p-1 tw-mx-4 tw-rounded-lg">
          <button
            onClick={() => setActiveTab("voters")}
            className={`tw-flex-1 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all tw-duration-200 ${
              activeTab === "voters"
                ? "tw-bg-primary-500/10 tw-text-primary-400 tw-shadow-sm tw-shadow-primary-500/10"
                : "tw-text-iron-400 hover:tw-text-iron-200 hover:tw-bg-iron-800/50"
            }`}
          >
            Top Voters
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`tw-flex-1 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all tw-duration-200 ${
              activeTab === "activity"
                ? "tw-bg-primary-500/10 tw-text-primary-400 tw-shadow-sm tw-shadow-primary-500/10"
                : "tw-text-iron-400 hover:tw-text-iron-200 hover:tw-bg-iron-800/50"
            }`}
          >
            Activity Log
          </button>
        </div>

        <div className="tw-p-4">
          {activeTab === "voters" ? (
            <div className="tw-space-y-2">
              {[1, 2, 3].map((index) => (
                <div key={index} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-text-iron-400 tw-font-medium">{index}.</span>
                    <span className="tw-text-iron-50">Username</span>
                  </div>
                  <span className="tw-text-iron-400">123 votes</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tw-space-y-3">
              <div className="tw-text-sm">
                <div className="tw-flex tw-items-start tw-gap-2">
                  <span className="tw-text-iron-50">Username</span>
                  <span className="tw-text-iron-400">voted for</span>
                  <span className="tw-text-iron-50">Recipient</span>
                </div>
                <div className="tw-text-xs tw-text-iron-500 tw-mt-1">2 minutes ago</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WaveLeaderboardRightSidebar;
