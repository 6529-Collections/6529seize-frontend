import React, { useContext } from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortDirection,
  WaveDropsLeaderboardSortBy,
} from "../../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../../auth/Auth";
import { WaveWinnersPodiumFirst } from "./WaveWinnersPodiumFirst";
import { WaveWinnersPodiumSecond } from "./WaveWinnersPodiumSecond";
import { WaveWinnersPodiumThird } from "./WaveWinnersPodiumThird";
import { motion } from "framer-motion";

interface WaveWinnersPodiumProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const PodiumPlaceholderCard = ({ height }: { height: string }) => (
  <div
    className={`tw-flex tw-flex-col tw-items-center tw-justify-end tw-w-full ${height} tw-bg-neutral-800/50 tw-rounded-lg tw-animate-pulse`}
  >
    <div className="tw-w-16 tw-h-16 tw-mb-4 tw-rounded-full tw-bg-neutral-700/50" />
    <div className="tw-w-24 tw-h-3 tw-mb-2 tw-rounded tw-bg-neutral-700/50" />
    <div className="tw-w-20 tw-h-3 tw-mb-4 tw-rounded tw-bg-neutral-700/50" />
  </div>
);

const podiumVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.2, 0.9, 0.3, 1],
      opacity: { duration: 0.25 }
    }
  })
};

export const WaveWinnersPodium: React.FC<WaveWinnersPodiumProps> = ({
  wave,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, isFetching } = useWaveDropsLeaderboard({
    waveId: wave.id,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: false,
    dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
    sortDirection: WaveDropsLeaderboardSortDirection.ASC,
    pollingEnabled: false,
  });

  const firstPlaceDrop = drops[0] ?? null;
  const secondPlaceDrop = drops[1] ?? null;
  const thirdPlaceDrop = drops[2] ?? null;

  if (isFetching && !drops.length) {
    return (
      <div className="tw-relative tw-mx-auto tw-max-w-3xl">
        <div className="tw-grid tw-grid-cols-3 tw-gap-x-6 tw-items-end">
          <PodiumPlaceholderCard height="tw-h-[280px]" />
          <PodiumPlaceholderCard height="tw-h-[320px]" />
          <PodiumPlaceholderCard height="tw-h-[240px]" />
        </div>
      </div>
    );
  }

  if (!drops.length) {
    return (
      <div className="tw-relative tw-mx-auto tw-max-w-3xl">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8 tw-text-center tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg">
          <div className="tw-h-10 tw-w-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-neutral-700/60 tw-ring-[8px] tw-ring-neutral-800/60">
            <svg
              className="tw-mx-auto tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.5 6.75h4.875c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125H2.625c-.621 0-1.125-.504-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H7.5m9 0V4.875c0-.621-.504-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125V6.75m9 0H7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="tw-mt-4 tw-text-sm tw-font-medium tw-text-neutral-100">
            No Submissions
          </div>
          <p className="tw-max-w-2xl tw-mb-0 tw-mt-1 tw-text-sm tw-text-neutral-500">
            This wave ended without any submissions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-relative tw-mx-auto tw-rounded-xl tw-overflow-hidden tw-pt-6 tw-px-6 tw-bg-iron-950/60">
      <div className="tw-max-w-3xl tw-mx-auto">
        <div className="tw-grid tw-grid-cols-3 tw-gap-x-8 tw-items-end">
          {secondPlaceDrop && (
            <motion.div
              variants={podiumVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <WaveWinnersPodiumSecond
                drop={secondPlaceDrop}
                wave={wave}
                onDropClick={onDropClick}
              />
            </motion.div>
          )}
          {firstPlaceDrop && (
            <motion.div
              variants={podiumVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <WaveWinnersPodiumFirst
                drop={firstPlaceDrop}
                wave={wave}
                onDropClick={onDropClick}
              />
            </motion.div>
          )}
          {thirdPlaceDrop && (
            <motion.div
              variants={podiumVariants}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <WaveWinnersPodiumThird
                drop={thirdPlaceDrop}
                wave={wave}
                onDropClick={onDropClick}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
