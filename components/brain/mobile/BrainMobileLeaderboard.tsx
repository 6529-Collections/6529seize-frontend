import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveLeaderboardDrops } from "../../waves/detailed/leaderboard/drops/WaveLeaderboardDrops";
import {
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { motion, AnimatePresence } from "framer-motion";
import { WaveDropCreate } from "../../waves/detailed/leaderboard/create/WaveDropCreate";
import useCapacitor from "../../../hooks/useCapacitor";

interface BrainMobileLeaderboardProps {
  readonly wave: ApiWave;
}

const BrainMobileLeaderboard: React.FC<BrainMobileLeaderboardProps> = ({
  wave,
}) => {
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  const capacitor = useCapacitor();

  const contentHeight = capacitor.isCapacitor
    ? "tw-h-[calc(100vh-20rem)]"
    : "tw-h-[calc(100vh-10.75rem)]";

  return (
    <div className={`tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-scrollbar-none tw-px-2 sm:tw-px-4 md:tw-px-6 ${contentHeight}`}>
      <div className="tw-space-y-4">
        <AnimatePresence>
          {isCreatingDrop && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <WaveDropCreate
                wave={wave}
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
          dropsSortBy={WaveDropsLeaderboardSortBy.RANK}
          sortDirection={WaveDropsLeaderboardSortDirection.DESC}
          showMyDrops={false}
          onCreateDrop={() => setIsCreatingDrop(true)}
        />
      </div>
    </div>
  );
};

export default BrainMobileLeaderboard;
