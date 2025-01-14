import React, { useMemo, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveWinners } from "../../waves/detailed/winners/WaveWinners";
import { WaveLeaderboardTime } from "../../waves/detailed/leaderboard/WaveLeaderboardTime";
import { WaveLeaderboardHeader } from "../../waves/detailed/leaderboard/header/WaveleaderboardHeader";
import { WaveLeaderboardSortType } from "../../waves/detailed/leaderboard/WaveLeaderboard";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { AnimatePresence, motion } from "framer-motion";
import { WaveDropCreate } from "../../waves/detailed/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardDrops } from "../../waves/detailed/leaderboard/drops/WaveLeaderboardDrops";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../../../hooks/useWaveState";
import useCapacitor from "../../../hooks/useCapacitor";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const calculateHeight = (isCapacitor: boolean) => {
  if (isCapacitor) {
    return "tw-h-[calc(100vh-18.75rem)]";
  }
  return `tw-h-[calc(100vh-13rem)]`;
};

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const capacitor = useCapacitor();

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto ${calculateHeight(
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
        <div className="tw-pb-4 lg:tw-pb-0">
          <WaveWinners wave={wave} onDropClick={onDropClick} />
        </div>
      ) : (
        <>
          <WaveLeaderboardTime wave={wave} />
          <WaveLeaderboardHeader
            wave={wave}
            sort={sort}
            setSort={setSort}
            showMyDrops={showMyDrops}
            setShowMyDrops={setShowMyDrops}
            onCreateDrop={() => setIsCreatingDrop(true)}
          />

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
            setActiveDrop={onDropClick}
            onCreateDrop={() => setIsCreatingDrop(true)}
          />
        </>
      )}
    </div>
  );
};

export default MyStreamWaveLeaderboard;
