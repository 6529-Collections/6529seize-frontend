import React, { useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useWaveTopVoters } from "../../../../hooks/useWaveTopVoters";
import { useAuth } from "../../../auth/Auth";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardRightSidebarVoter } from "../leaderboard/sidebar/WaveLeaderboardRightSidebarVoter";

interface WaveDropVotersProps {
  readonly drop: ApiDrop;
}

export const WaveDropVoters: React.FC<WaveDropVotersProps> = ({ drop }) => {
  const { connectedProfile } = useAuth();
  const { voters, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useWaveTopVoters({
      waveId: drop.wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: false,
      dropId: drop.id,
      sortDirection: "DESC",
      sort: "ABSOLUTE",
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  const [isVotersOpen, setIsVotersOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsVotersOpen(!isVotersOpen)}
        className="tw-w-full tw-group tw-ring-1 tw-ring-iron-700 tw-ring-inset desktop-hover:hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-3 tw-px-5 tw-rounded-xl sm:tw-text-sm tw-bg-iron-950 tw-transition-all tw-duration-300 tw-border-0"
      >
        <span
          className={
            isVotersOpen
              ? "tw-text-primary-300"
              : "tw-text-iron-300 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
          }
        >
          Top Voters
        </span>
        <motion.svg
          animate={{ rotate: isVotersOpen ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          className={`tw-w-4 tw-h-4 ${
            isVotersOpen
              ? "tw-text-primary-300"
              : "tw-text-iron-400 desktop-hover:group-hover:tw-text-primary-300 tw-transition-all tw-duration-300"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
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
        {isVotersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-overflow-hidden"
          >
            {voters.map((voter, index) => (
              <WaveLeaderboardRightSidebarVoter
                voter={voter}
                key={voter.voter.id}
                position={index + 1}
              />
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
