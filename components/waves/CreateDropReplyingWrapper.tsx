import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import CreateDropReplying from "./CreateDropReplying";

interface CreateDropReplyingWrapperProps {
  readonly activeDrop: ActiveDropState | null;
  readonly submitting: boolean;
  readonly dropId: string | null;
  readonly onCancelReplyQuote: () => void;
  readonly suppressInitialHeightAnimation?: boolean | undefined;
}

const CreateDropReplyingWrapper: React.FC<CreateDropReplyingWrapperProps> = ({
  activeDrop,
  submitting,
  dropId,
  onCancelReplyQuote,
  suppressInitialHeightAnimation = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const initial = suppressInitialHeightAnimation
    ? { opacity: 0, y: shouldReduceMotion ? 0 : 8 }
    : { opacity: 0, height: 0 };
  const animate = suppressInitialHeightAnimation
    ? { opacity: 1, y: 0 }
    : { opacity: 1, height: "auto" };
  const exit = suppressInitialHeightAnimation
    ? { opacity: 0, y: shouldReduceMotion ? 0 : 6 }
    : { opacity: 0, height: 0 };
  const animationDuration = suppressInitialHeightAnimation ? 0.2 : 0.3;
  const transition = {
    duration: shouldReduceMotion ? 0 : animationDuration,
    ease: "easeOut",
  };

  return (
    <AnimatePresence>
      {activeDrop && activeDrop.drop.id !== dropId && (
        <motion.div
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
          {...(suppressInitialHeightAnimation
            ? { className: "tw-transform-gpu tw-will-change-transform" }
            : {})}
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
