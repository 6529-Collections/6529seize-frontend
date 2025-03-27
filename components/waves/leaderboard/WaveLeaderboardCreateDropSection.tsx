import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveDropCreate } from "./create/WaveDropCreate";

interface WaveLeaderboardCreateDropSectionProps {
  readonly wave: ApiWave;
  readonly isCreatingDrop: boolean;
  readonly onCancel: () => void;
  readonly onSuccess: () => void;
}

export const WaveLeaderboardCreateDropSection: React.FC<WaveLeaderboardCreateDropSectionProps> = ({
  wave,
  isCreatingDrop,
  onCancel,
  onSuccess,
}) => {
  return (
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
            onCancel={onCancel}
            onSuccess={onSuccess}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};