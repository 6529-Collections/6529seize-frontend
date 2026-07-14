"use client";

import React, { useCallback } from "react";
import { m, useReducedMotion } from "framer-motion";
import { useWaveData } from "@/hooks/useWaveData";
import useCapacitor from "@/hooks/useCapacitor";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";

interface BrainContentInputProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
}

const BrainContentInput: React.FC<BrainContentInputProps> = ({
  activeDrop,
  onCancelReplyQuote,
}) => {
  const capacitor = useCapacitor();
  const shouldReduceMotion = useReducedMotion();
  const handleWaveNotFound = useCallback(() => {
    onCancelReplyQuote();
  }, [onCancelReplyQuote]);
  const { data: wave, isError } = useWaveData({
    waveId: activeDrop?.drop.wave.id ?? null,
    onWaveNotFound: handleWaveNotFound,
  });
  const containerClassName = capacitor.isCapacitor
    ? "tw-max-h-[calc(100vh-14.7rem)]"
    : "tw-max-h-[calc(100vh-20rem)] lg:tw-max-h-[calc(100vh-20rem)]";
  const composerSurfaceClassName = `${containerClassName} tw-sticky tw-top-0 tw-z-30 tw-w-full tw-flex-none tw-overflow-y-auto tw-rounded-xl tw-bg-iron-950 tw-p-2 tw-shadow-lg tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition-colors tw-duration-500 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 md:tw-p-4`;
  const contentMotionInitial = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 0, y: 8 };
  const contentMotionAnimate = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };
  const contentMotionTransition = {
    duration: shouldReduceMotion ? 0 : 0.18,
    ease: "easeOut",
  };

  if (!activeDrop) {
    return null;
  }

  if (!wave) {
    if (isError) {
      return null;
    }

    return (
      <div
        className={`${composerSurfaceClassName} motion-safe:tw-animate-pulse`}
      >
        <span className="tw-sr-only" role="status" aria-live="polite">
          Loading reply composer
        </span>
        <m.div
          initial={contentMotionInitial}
          animate={contentMotionAnimate}
          transition={contentMotionTransition}
          aria-hidden="true"
        >
          <div className="-tw-mt-2 tw-mb-1 tw-flex tw-h-8 tw-items-center tw-justify-between">
            <div className="tw-h-3 tw-w-28 tw-rounded tw-bg-iron-900" />
            <div className="tw-h-8 tw-w-8 tw-rounded-lg tw-bg-iron-900" />
          </div>
          <div className="tw-flex tw-w-full tw-items-end">
            <div className="tw-grid tw-w-full tw-grid-cols-[auto_minmax(0,1fr)] tw-items-center tw-gap-x-2 lg:tw-gap-x-3">
              <div className="tw-col-start-1 tw-row-start-2 tw-mb-1 tw-h-9 tw-w-9 tw-self-end tw-rounded-lg tw-bg-iron-900" />
              <div className="tw-col-start-2 tw-row-start-2 tw-h-11 tw-min-w-0 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800" />
            </div>
            <div className="tw-ml-2 lg:tw-ml-3">
              <div className="tw-h-10 tw-w-10 tw-rounded-lg tw-bg-iron-900" />
            </div>
          </div>
        </m.div>
      </div>
    );
  }

  return (
    <div className={composerSurfaceClassName}>
      <m.div
        initial={contentMotionInitial}
        animate={contentMotionAnimate}
        transition={contentMotionTransition}
      >
        <PrivilegedDropCreator
          key={wave.id}
          wave={wave}
          activeDrop={activeDrop}
          onCancelReplyQuote={onCancelReplyQuote}
          onAllDropsAdded={onCancelReplyQuote}
          onDropAddedToQueue={onCancelReplyQuote}
          dropId={null}
          fixedDropMode={DropMode.CHAT}
          focusOnInitialActiveDrop
        />
      </m.div>
    </div>
  );
};

export default BrainContentInput;
