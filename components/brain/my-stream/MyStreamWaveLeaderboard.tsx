import React, { useMemo, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveWinners } from "../../waves/detailed/winners/WaveWinners";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import useCapacitor from "../../../hooks/useCapacitor";
import { WaveLeaderboardSortType } from "../../waves/leaderboard/WaveLeaderboard";
import { WaveLeaderboardTime } from "../../waves/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "../../waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "../../waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "../../waves/leaderboard/drops/WaveLeaderboardDrops";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const calculateHeight = (isCapacitor: boolean) => {
  if (isCapacitor) {
    return "tw-h-[calc(100vh-18rem)]";
  }
  return `tw-h-[calc(100vh-10.25rem)] min-[1200px]:tw-h-[calc(100vh-11.5rem)] lg:tw-pr-2`;
};

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const capacitor = useCapacitor();

  const containerClassName = useMemo(() => {
    return `lg:tw-pt-4 tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden ${calculateHeight(
      capacitor.isCapacitor
    )}`;
  }, [capacitor.isCapacitor]);
  const { votingState } = useWaveState(wave);
  const [sort, setSort] = useState<WaveLeaderboardSortType>(
    WaveLeaderboardSortType.RANK
  );
  const [showMyDrops, setShowMyDrops] = useState(false);
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);

  const sortBy: Record<WaveLeaderboardSortType, WaveDropsLeaderboardSortBy> = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortBy.RANK,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortBy.CREATION_TIME,
  };

  const sortDirection: Record<
    WaveLeaderboardSortType,
    WaveDropsLeaderboardSortDirection
  > = {
    [WaveLeaderboardSortType.RANK]: WaveDropsLeaderboardSortDirection.DESC,
    [WaveLeaderboardSortType.RECENT]: WaveDropsLeaderboardSortDirection.ASC,
  };

  return (
    <div className={containerClassName}>
      {votingState === WaveVotingState.ENDED ? (
        <div>
          <WaveWinners wave={wave} onDropClick={onDropClick} />
        </div>
      ) : (
        <>
          <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
            <WaveLeaderboardTime wave={wave} />
            <WaveLeaderboardHeader
              wave={wave}
              sort={sort}
              setSort={setSort}
              showMyDrops={showMyDrops}
              setShowMyDrops={setShowMyDrops}
              onCreateDrop={() => setIsCreatingDrop(true)}
            />
          </div>

          <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
            <AnimatePresence>
              {isCreatingDrop && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <WaveDropCreate
                    wave={wave!}
                    onCancel={() => setIsCreatingDrop(false)}
                    onSuccess={() => {
                      setIsCreatingDrop(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <WaveLeaderboardDrops
              wave={wave}
              dropsSortBy={sortBy[sort]}
              sortDirection={sortDirection[sort]}
              showMyDrops={showMyDrops}
              onCreateDrop={() => setIsCreatingDrop(true)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MyStreamWaveLeaderboard;
