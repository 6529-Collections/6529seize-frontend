"use client";

import MemesWaveQuickVoteTrigger from "@/components/brain/left-sidebar/waves/MemesWaveQuickVoteTrigger";
import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

interface MemesWaveFooterProps {
  readonly collapsed?: boolean | undefined;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

const revealTransition = {
  duration: 0.22,
  ease: "easeOut",
} as const;

const MemesWaveFooter: React.FC<MemesWaveFooterProps> = ({
  collapsed = false,
  onOpenQuickVote,
  onPrefetchQuickVote,
}) => {
  const { isReady, uncastPower, unratedCount, votingLabel } =
    useMemesWaveFooterStats();

  const handleOpenQuickVote = () => {
    if (unratedCount <= 0) {
      return;
    }

    onOpenQuickVote();
  };

  const handlePrefetchQuickVote = () => {
    if (unratedCount <= 0) {
      return;
    }

    onPrefetchQuickVote?.();
  };

  return (
    <AnimatePresence>
      {isReady && typeof uncastPower === "number" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={revealTransition}
          className={
            collapsed
              ? "tw-z-10 tw-flex tw-flex-shrink-0 tw-justify-center tw-px-2 tw-pb-2 tw-pt-1"
              : "tw-relative tw-z-20 tw-mt-auto tw-flex-shrink-0"
          }
        >
          {collapsed ? (
            <MemesWaveQuickVoteTrigger
              onOpenQuickVote={handleOpenQuickVote}
              onPrefetchQuickVote={handlePrefetchQuickVote}
              unratedCount={unratedCount}
            />
          ) : (
            <button
              type="button"
              aria-label={`Uncast Power, ${formatNumberWithCommas(
                uncastPower
              )} ${votingLabel ?? "Votes"} left, ${formatNumberWithCommas(
                unratedCount
              )} left`}
              onClick={handleOpenQuickVote}
              onFocus={handlePrefetchQuickVote}
              onMouseEnter={handlePrefetchQuickVote}
              className="tw-mt-auto tw-w-full tw-flex-shrink-0 tw-cursor-pointer tw-border-0 tw-border-t tw-border-solid tw-border-zinc-800/60 tw-bg-[#000000] tw-p-4 tw-text-left tw-transition-colors hover:tw-bg-zinc-900/30"
            >
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-rounded-2xl tw-border tw-border-solid tw-border-[#2d3753] tw-bg-[#0c1018] tw-px-4 tw-py-3 tw-shadow-lg">
                <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
                  <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-[#6b7c93]">
                    Uncast Power
                  </span>

                  <div className="tw-flex tw-items-center tw-gap-2">
                    <MemesWaveZapIcon className="tw-size-4 tw-flex-shrink-0 tw-fill-blue-400/20 tw-text-blue-400" />
                    <span className="tw-truncate tw-text-sm tw-font-bold tw-tracking-tight tw-text-white">
                      {formatNumberWithCommas(uncastPower)}
                      {votingLabel ? ` ${votingLabel}` : " votes"}
                    </span>
                  </div>
                </div>

                <span className="tw-text-xs tw-font-semibold tw-text-[#8199ea] tw-shadow-sm">
                  {formatNumberWithCommas(unratedCount)} unexplored
                </span>
              </div>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemesWaveFooter;
