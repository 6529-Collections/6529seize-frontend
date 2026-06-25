"use client";

import MemesWaveQuickVoteTrigger from "@/components/brain/left-sidebar/waves/MemesWaveQuickVoteTrigger";
import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  formatMemesQuickVoteLeftThisRoundText,
  formatMemesQuickVoteUnratedText,
} from "@/hooks/memesQuickVote.helpers";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import React from "react";

interface MemesWaveFooterProps {
  readonly collapsed?: boolean | undefined;
  readonly floating?: boolean | undefined;
  readonly onOpenQuickVote: () => void;
  readonly onPrefetchQuickVote?: (() => void) | undefined;
}

const revealTransition = {
  duration: 0.22,
  ease: "easeOut",
} as const;

const MemesWaveFooter: React.FC<MemesWaveFooterProps> = ({
  collapsed = false,
  floating = false,
  onOpenQuickVote,
  onPrefetchQuickVote,
}) => {
  const {
    isAvailable,
    isReady,
    leftThisRoundCount,
    uncastPower,
    unratedCount,
    votingLabel,
  } = useMemesWaveFooterStats();
  const buttonAriaLabel =
    isReady && typeof uncastPower === "number"
      ? `Uncast Power, ${formatNumberWithCommas(uncastPower)} ${
          votingLabel ?? "Votes"
        } left, ${formatMemesQuickVoteLeftThisRoundText(
          leftThisRoundCount
        )}, ${formatMemesQuickVoteUnratedText(unratedCount)}`
      : "Quick vote";
  const buttonTitle = isReady ? "Uncast Power" : "Quick vote";
  const votingPowerLabel = votingLabel ? ` ${votingLabel}` : " votes";
  const buttonValue =
    isReady && typeof uncastPower === "number"
      ? `${formatNumberWithCommas(uncastPower)}${votingPowerLabel}`
      : "Open quick vote";

  const handleOpenQuickVote = () => {
    if (!isAvailable) {
      return;
    }

    onOpenQuickVote();
  };

  const handlePrefetchQuickVote = () => {
    if (!isAvailable) {
      return;
    }

    onPrefetchQuickVote?.();
  };

  const containerClassName = collapsed
    ? "tw-z-10 tw-flex tw-flex-shrink-0 tw-justify-center tw-gap-2 tw-px-4 tw-pb-2 tw-pt-1"
    : floating
      ? "tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-[calc(4.75rem+max(calc(env(safe-area-inset-bottom,0px)-0.875rem),0px))] tw-z-40 tw-flex tw-justify-center tw-px-4"
      : "tw-relative tw-z-20 tw-mt-auto tw-flex-shrink-0";
  const expandedFrameClassName = floating
    ? "tw-pointer-events-auto tw-w-[min(calc(100vw-2.25rem),38rem)] tw-flex-shrink-0"
    : "tw-mt-auto tw-w-full tw-flex-shrink-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/60 tw-bg-black tw-p-4";

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isAvailable && (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={revealTransition}
            className={containerClassName}
          >
            {collapsed ? (
              <MemesWaveQuickVoteTrigger
                isAvailable={isAvailable}
                leftThisRoundCount={leftThisRoundCount}
                onOpenQuickVote={handleOpenQuickVote}
                onPrefetchQuickVote={handlePrefetchQuickVote}
                unratedCount={unratedCount}
              />
            ) : (
              <div className={expandedFrameClassName}>
                <div className="tw-flex tw-items-stretch tw-gap-2">
                  <button
                    type="button"
                    aria-label={buttonAriaLabel}
                    onClick={handleOpenQuickVote}
                    onFocus={handlePrefetchQuickVote}
                    onMouseEnter={handlePrefetchQuickVote}
                    className="tw-group tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-left"
                  >
                    <div className="tw-relative tw-flex tw-h-full tw-items-center tw-justify-between tw-gap-4 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#2d3753] tw-bg-[#0c1018] tw-px-4 tw-py-2.5 tw-shadow-lg tw-transition-all tw-duration-200 desktop-hover:group-hover:tw-border-[#3a4670] desktop-hover:group-hover:tw-bg-[#0f1420]">
                      <span
                        aria-hidden="true"
                        className="tw-pointer-events-none tw-absolute tw-inset-0 -tw-translate-x-full tw-bg-gradient-to-r tw-from-white/0 tw-via-white/[0.08] tw-to-white/0 tw-opacity-50 tw-transition-transform tw-duration-1000 tw-ease-out desktop-hover:group-hover:tw-translate-x-full"
                      />
                      <div className="tw-relative tw-z-10 tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
                        <span className="tw-whitespace-nowrap tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-400">
                          {buttonTitle}
                        </span>

                        <div className="tw-flex tw-items-center tw-gap-2">
                          <MemesWaveZapIcon className="tw-size-4 tw-flex-shrink-0 tw-fill-primary-400/20 tw-text-primary-400" />
                          <span className="tw-truncate tw-text-sm tw-font-semibold tw-tracking-tight tw-text-white">
                            {buttonValue}
                          </span>
                        </div>
                      </div>

                      {isReady && (
                        <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-items-end tw-gap-0.5 tw-text-right">
                          <span className="tw-text-xs tw-font-semibold tw-text-[#8199ea] tw-shadow-sm">
                            {formatMemesQuickVoteLeftThisRoundText(
                              leftThisRoundCount
                            )}
                          </span>
                          <span className="tw-text-[11px] tw-font-medium tw-text-iron-400">
                            {formatMemesQuickVoteUnratedText(unratedCount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

export default MemesWaveFooter;
