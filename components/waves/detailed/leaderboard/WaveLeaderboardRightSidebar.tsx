import React, { useState } from "react";
import { motion } from "framer-motion";

interface WaveLeaderboardRightSidebarProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

type Tab = "voters" | "activity";

const WaveLeaderboardRightSidebar: React.FC<
  WaveLeaderboardRightSidebarProps
> = ({ isOpen, onToggle }) => {
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
      <div className="tw-pt-[5.6rem] xl:tw-pt-[6.25rem] tw-text-iron-500 tw-text-sm tw-overflow-y-auto tw-h-full">
        <div className="tw-px-4 tw-pt-4">
          <div className="tw-p-0.5 tw-relative tw-ring-1 tw-ring-inset tw-bg-iron-950 tw-ring-iron-700 tw-inline-flex tw-rounded-lg tw-w-auto tw-gap-x-0.5">
            <div
              className={
                activeTab === "voters"
                  ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800"
                  : "tw-p-[1px] tw-flex tw-rounded-lg"
              }
            >
              <button
                onClick={() => setActiveTab("voters")}
                className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
                  activeTab === "voters"
                    ? "tw-bg-iron-800 tw-text-iron-100"
                    : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
                }`}
              >
                Top Voters
              </button>
            </div>
            <div
              className={
                activeTab === "activity"
                  ? "tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-700 tw-to-iron-800"
                  : "tw-p-[1px] tw-flex tw-rounded-lg"
              }
            >
              <button
                onClick={() => setActiveTab("activity")}
                className={`tw-whitespace-nowrap tw-flex-1 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-font-medium tw-border-0 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-out ${
                  activeTab === "activity"
                    ? "tw-bg-iron-800 tw-text-iron-100"
                    : "tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100"
                }`}
              >
                Activity Log
              </button>
            </div>
          </div>
        </div>

        <div className="tw-p-4">
          {activeTab === "voters" ? (
            <div className="tw-space-y-2">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200"
                >
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-text-iron-400 tw-font-medium">
                      {index}.
                    </span>
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        src=""
                        alt=""
                        className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-white/10 tw-bg-iron-800"
                      />
                      <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                        Username
                      </span>
                    </div>
                  </div>
                  <span>
                    <span className="tw-text-iron-400">123 </span>{" "}
                    <span className="tw-text-xs tw-text-iron-400">TDH total</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="tw-space-y-3">
              <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">Just now</span>
                  <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">250 TDH</span>
                </div>
                <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <img
                      src="https://placehold.co/32x32/374151/FFF"
                      alt=""
                      className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-iron-50">AlexWeb3</span>
                  </div>
                  <span className="tw-text-sm tw-text-iron-400">voted</span>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <img
                      src="https://placehold.co/32x32/1F2937/FFF"
                      alt=""
                      className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-iron-50">CryptoKing</span>
                  </div>
                </div>
              </div>
              <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">5m ago</span>
                  <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">175 TDH</span>
                </div>
                <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <img
                      src="https://placehold.co/32x32/4B5563/FFF"
                      alt=""
                      className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-iron-50">MetaMaster</span>
                  </div>
                  <span className="tw-text-sm tw-text-iron-400">voted</span>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <img
                      src="https://placehold.co/32x32/6B7280/FFF"
                      alt=""
                      className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-iron-50">BlockBuilder</span>
                  </div>
                </div>
              </div>
              <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">15m ago</span>
                  <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">325 TDH</span>
                </div>
                <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <img
                      src="https://placehold.co/32x32/9CA3AF/FFF"
                      alt=""
                      className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-iron-50">ChainChamp</span>
                  </div>
                  <span className="tw-text-sm tw-text-iron-400">voted</span>
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <img
                      src="https://placehold.co/32x32/D1D5DB/FFF"
                      alt=""
                      className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                    />
                    <span className="tw-text-sm tw-font-medium tw-text-iron-50">TokenWhiz</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WaveLeaderboardRightSidebar;
