import React, { useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useWaveActivityLogs } from "../../../../hooks/useWaveActivityLogs";
import { useAuth } from "../../../auth/Auth";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardRightSidebarActivityLog } from "../leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLog";

interface WaveDropLogsProps {
  readonly drop: ApiDrop;
}

export const WaveDropLogs: React.FC<WaveDropLogsProps> = ({ drop }) => {
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const { connectedProfile } = useAuth();
  const { logs, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useWaveActivityLogs({
      waveId: drop.wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: false,
      dropId: drop.id,
      logTypes: ["DROP_VOTE_EDIT"],
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div>
      <button
        onClick={() => setIsActivityOpen(!isActivityOpen)}
        className={`tw-text-sm tw-w-full tw-group tw-ring-1 tw-ring-iron-700 desktop-hover:hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-3 tw-px-5 tw-bg-iron-900 tw-transition-all tw-duration-300 tw-border-0 ${
          isActivityOpen ? "tw-rounded-t-xl" : "tw-rounded-xl"
        }`}
      >
        <span
          className={
            isActivityOpen
              ? "tw-text-primary-300"
              : "tw-text-iron-300 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
          }
        >
          Activity Logs
        </span>
        <motion.svg
          animate={{ rotate: isActivityOpen ? 0 : 180 }}
          className={`tw-w-4 tw-h-4 ${
            isActivityOpen
              ? "tw-text-primary-300"
              : "tw-text-iron-400 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isActivityOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-overflow-hidden tw-ring-1 tw-ring-iron-700 tw-rounded-b-xl tw-bg-iron-900"
          >
            {logs.map((log) => (
              <WaveLeaderboardRightSidebarActivityLog key={log.id} log={log} />
            ))}
            {isFetchingNextPage && (
              <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
                <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
              </div>
            )}
            <div ref={intersectionElementRef}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
