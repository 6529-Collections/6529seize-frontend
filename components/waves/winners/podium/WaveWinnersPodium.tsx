import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortDirection,
  WaveDropsLeaderboardSortBy,
} from "../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../auth/Auth";
import { WaveWinnersPodiumFirst } from "./WaveWinnersPodiumFirst";
import { WaveWinnersPodiumSecond } from "./WaveWinnersPodiumSecond";
import { WaveWinnersPodiumThird } from "./WaveWinnersPodiumThird";
import { motion } from "framer-motion";
import { WaveWinnersPodiumPlaceholder } from "./WaveWinnersPodiumPlaceholder";

interface WaveWinnersPodiumProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const PodiumPlaceholderCard = ({ height }: { height: string }) => (
  <div className="tw-relative">
    <div className="tw-absolute tw-left-1/2 -tw-translate-x-1/2 -tw-top-6 tw-z-10">
      <div className="tw-w-12 tw-h-12 tw-rounded-xl tw-bg-iron-800/80 tw-animate-pulse" />
    </div>
    <div
      className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full ${height} tw-bg-iron-900/80 tw-rounded-xl tw-border tw-border-iron-800/60 tw-backdrop-blur-xl tw-pt-8`}
    >
      <div className="tw-w-24 tw-h-4 tw-mb-2 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
      <div className="tw-w-20 tw-h-4 tw-mb-2 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
      <div className="tw-w-16 tw-h-4 tw-rounded-lg tw-bg-iron-800/80 tw-animate-pulse" />
    </div>
  </div>
);

const podiumVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.2, 0.9, 0.3, 1],
      opacity: { duration: 0.25 },
    },
  }),
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
      <div className="tw-relative tw-mx-auto tw-rounded-xl tw-overflow-hidden tw-pt-16 tw-px-4 tw-bg-iron-950/60">
        <div className="tw-grid tw-grid-cols-3 tw-gap-x-4 tw-max-w-3xl tw-mx-auto tw-items-end">
          <PodiumPlaceholderCard height="tw-h-[190px]" />
          <PodiumPlaceholderCard height="tw-h-[220px]" />
          <PodiumPlaceholderCard height="tw-h-[170px]" />
        </div>
      </div>
    );
  }

  if (!drops.length) {
    return (
      <div className="tw-relative tw-mx-auto tw-rounded-xl tw-overflow-hidden tw-px-4 tw-bg-iron-950/60">
        <div className="tw-max-w-3xl tw-mx-auto">
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-16 tw-text-center">
            <div className="tw-h-14 tw-w-14 tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-bg-iron-900/80 tw-backdrop-blur-sm tw-border tw-border-iron-800/60 tw-shadow-[0_0_32px_rgba(0,0,0,0.25)]">
              <svg
                className="tw-mx-auto tw-flex-shrink-0 tw-h-7 tw-w-7 tw-text-iron-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
              >
                <path
                  fill="currentColor"
                  d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                />
              </svg>
            </div>
            <div className="tw-mt-5 tw-text-lg tw-font-semibold tw-text-iron-300">
              No Winners to Display
            </div>
            <p className="tw-max-w-md tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              This wave ended without any submissions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-relative tw-mx-auto tw-rounded-xl tw-overflow-hidden tw-pt-6 lg:tw-px-4 tw-bg-iron-950/60">
      <div className="md:tw-max-w-3xl tw-mx-auto">
        <div className="tw-grid tw-grid-cols-3 tw-gap-x-2 lg:tw-gap-x-4 tw-items-end">
          <div>
            {secondPlaceDrop ? (
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
            ) : (
              <WaveWinnersPodiumPlaceholder
                height="tw-h-[190px]"
                position="second"
              />
            )}
          </div>
          <div>
            {firstPlaceDrop ? (
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
            ) : (
              <WaveWinnersPodiumPlaceholder
                height="tw-h-[220px]"
                position="first"
              />
            )}
          </div>
          <div>
            {thirdPlaceDrop ? (
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
            ) : (
              <WaveWinnersPodiumPlaceholder
                height="tw-h-[170px]"
                position="third"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
