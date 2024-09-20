import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropReplying from "../CreateDropReplying";
import { ActiveDropState } from "./WaveDetailedContent";

interface CreateDropReplyingWrapperProps {
  readonly activeDrop: ActiveDropState | null;
  readonly submitting: boolean;
  readonly onCancelReplyQuote: () => void;
}

const CreateDropReplyingWrapper: React.FC<CreateDropReplyingWrapperProps> = ({
  activeDrop,
  submitting,
  onCancelReplyQuote,
}) => {
  return (
    <AnimatePresence>
      {activeDrop && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CreateDropReplying
            drop={activeDrop.drop}
            action={activeDrop.action}
            onCancel={onCancelReplyQuote}
            disabled={submitting}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateDropReplyingWrapper;
