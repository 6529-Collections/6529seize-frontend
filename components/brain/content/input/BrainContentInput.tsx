import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWaveData } from "../../../../hooks/useWaveData";
import useCapacitor from "../../../../hooks/useCapacitor";
import { ActiveDropState } from "../../../waves/detailed/chat/WaveChat";
import PrivilegedDropCreator, {
  DropMode,
} from "../../../waves/detailed/PrivilegedDropCreator";

interface BrainContentInputProps {
  readonly waveId: string | null;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContentInput: React.FC<BrainContentInputProps> = ({
  waveId,
  activeDrop,
  onCancelReplyQuote,
}) => {
  const capacitor = useCapacitor();
  const { data: wave } = useWaveData(waveId);
  const containerClassName = useMemo(() => {
    return capacitor.isCapacitor
      ? "tw-max-h-[calc(100vh-14.7rem)]"
      : "tw-max-h-[calc(100vh-20rem)] lg:tw-max-h-[calc(100vh-20rem)]";
  }, [capacitor.isCapacitor]);
  if (!wave) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: "auto",
          opacity: 1,
          transition: {
            height: { duration: 0.2, ease: "easeOut" },
            opacity: { duration: 0.15, delay: 0.15 }
          }
        }}
        exit={{
          height: 0,
          opacity: 0,
          transition: {
            height: { duration: 0.2, delay: 0.1, ease: "easeIn" },
            opacity: { duration: 0.1 }
          }
        }}
        className="tw-overflow-hidden"
      >
        <div className={`${containerClassName} tw-overflow-y-auto tw-w-full tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-sticky tw-top-0 tw-z-30 tw-flex-none tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-p-4 tw-shadow-lg`}>
          <PrivilegedDropCreator
            wave={wave}
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
            key={wave.id}
            dropId={null}
            fixedDropMode={DropMode.BOTH}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BrainContentInput;
