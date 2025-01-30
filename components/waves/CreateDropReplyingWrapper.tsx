import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ActiveDropState } from "../../types/dropInteractionTypes";
import CreateDropReplying from "./CreateDropReplying";

interface CreateDropReplyingWrapperProps {
  readonly activeDrop: ActiveDropState | null;
  readonly submitting: boolean;
  readonly dropId: string | null;
  readonly onCancelReplyQuote: () => void;
}

const CreateDropReplyingWrapper: React.FC<CreateDropReplyingWrapperProps> = ({
  activeDrop,
  submitting,
  dropId,
  onCancelReplyQuote,
}) => {
  return (
    <AnimatePresence>
      {activeDrop && activeDrop.drop.id !== dropId && (
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
