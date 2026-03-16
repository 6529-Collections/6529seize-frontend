"use client";

import MemesQuickVoteDialog from "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AnimatePresence, motion } from "framer-motion";
import { BoltIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";

interface MemesWaveFooterProps {
  readonly collapsed?: boolean | undefined;
}

const revealTransition = {
  duration: 0.22,
  ease: "easeOut",
} as const;

const MemesWaveFooter: React.FC<MemesWaveFooterProps> = ({
  collapsed = false,
}) => {
  const { isReady, uncastPower, unratedCount, votingLabel } =
    useMemesWaveFooterStats();
  const [isQuickVoteOpen, setIsQuickVoteOpen] = useState(false);
  const [quickVoteSessionId, setQuickVoteSessionId] = useState(0);

  const handleOpenQuickVote = () => {
    if (!isReady || typeof uncastPower !== "number" || unratedCount <= 0) {
      return;
    }

    setQuickVoteSessionId((current) => current + 1);
    setIsQuickVoteOpen(true);
  };

  return (
    <>
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
                : "tw-z-10 tw-flex-shrink-0 tw-bg-gradient-to-t tw-from-iron-950 tw-via-iron-950/95 tw-to-transparent tw-px-4 tw-pb-4 tw-pt-6"
            }
          >
            {collapsed ? (
              <button
                type="button"
                aria-label={`${unratedCount} submissions left unrated in memes wave`}
                title={`${unratedCount} left`}
                onClick={handleOpenQuickVote}
                className="tw-flex tw-items-center tw-gap-x-1.5 tw-rounded-full tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-px-2.5 tw-py-2 tw-text-primary-300 tw-shadow-[0_12px_24px_rgba(11,93,255,0.2)] tw-transition-colors tw-duration-300 desktop-hover:hover:tw-border-primary-400/40 desktop-hover:hover:tw-bg-primary-500/15"
              >
                <BoltIcon className="tw-size-4 tw-flex-shrink-0" />
                <span className="tw-text-xs tw-font-semibold">
                  {formatNumberWithCommas(unratedCount)}
                </span>
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Uncast Power, ${formatNumberWithCommas(
                  uncastPower
                )} ${votingLabel ?? "Votes"}, ${unratedCount} left`}
                onClick={handleOpenQuickVote}
                className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-4 tw-rounded-2xl tw-border tw-border-solid tw-border-primary-500/30 tw-bg-iron-900/95 tw-px-4 tw-py-3 tw-text-left tw-shadow-[0_18px_36px_rgba(0,0,0,0.28)] tw-backdrop-blur-sm tw-transition-colors tw-duration-300 desktop-hover:hover:tw-border-primary-400/40 desktop-hover:hover:tw-bg-iron-900"
              >
                <div className="tw-min-w-0 tw-flex-1">
                  <div className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
                    Uncast Power
                  </div>
                  <div className="tw-mt-1 tw-flex tw-items-center tw-gap-x-2 tw-text-primary-300">
                    <BoltIcon className="tw-size-4 tw-flex-shrink-0" />
                    <span className="tw-truncate tw-text-lg tw-font-semibold">
                      {formatNumberWithCommas(uncastPower)}
                      {votingLabel ? ` ${votingLabel}` : ""}
                    </span>
                  </div>
                </div>
                <span className="tw-flex-shrink-0 tw-rounded-xl tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-300">
                  {formatNumberWithCommas(unratedCount)} left
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <MemesQuickVoteDialog
        isOpen={isQuickVoteOpen}
        sessionId={quickVoteSessionId}
        onClose={() => setIsQuickVoteOpen(false)}
      />
    </>
  );
};

export default MemesWaveFooter;
