"use client";

import type { FC} from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { SparklesIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface WaveRepOutcomeProps {
  readonly outcome: ApiWaveOutcome;
  readonly distribution: WaveOutcomeDistributionState;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveRepOutcome: FC<WaveRepOutcomeProps> = ({
  outcome,
  distribution,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const {
    items,
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isError,
    errorMessage,
  } = distribution;
  const winnersCount = totalCount;
  const visibleItems = showAll
    ? items
    : items.slice(0, DEFAULT_AMOUNTS_TO_SHOW);

  const hiddenLocalCount = Math.max(
    items.length - DEFAULT_AMOUNTS_TO_SHOW,
    0
  );
  const remainingFromServer = Math.max(totalCount - items.length, 0);
  const remainingCount = showAll
    ? remainingFromServer
    : hiddenLocalCount + remainingFromServer;
  const shouldShowMore =
    hasNextPage || (!showAll && items.length > DEFAULT_AMOUNTS_TO_SHOW);

  const onViewMore = () => {
    if (!showAll) {
      setShowAll(true);
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-white/5 tw-transition-all tw-duration-300 desktop-hover:hover:tw-ring-white/10">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-border-0 tw-px-4 tw-py-4 tw-bg-transparent tw-cursor-pointer"
      >
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-center tw-size-10 tw-rounded-lg tw-bg-[#C3B5D9]/10">
              <SparklesIcon className="tw-size-5 tw-text-[#C3B5D9]" />
            </div>
            <div className="tw-text-left">
              <div className="tw-text-sm tw-font-medium tw-text-iron-200">
                Rep
              </div>
              <div className="tw-text-xs tw-text-iron-500">
                {isLoading ? (
                  <span className="tw-animate-pulse tw-bg-iron-800 tw-h-3 tw-w-16 tw-rounded tw-inline-block" />
                ) : (
                  <>
                    {formatNumberWithCommas(winnersCount)}{" "}
                    {winnersCount === 1 ? "winner" : "winners"}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-text-right">
              <div className="tw-text-sm tw-font-semibold tw-text-[#C3B5D9]">
                {formatNumberWithCommas(outcome.amount ?? 0)}
              </div>
              <div className="tw-text-xs tw-text-iron-500">total pool</div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDownIcon className="tw-size-4 tw-text-iron-500" />
            </motion.div>
          </div>
        </div>
        {outcome.rep_category && (
          <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-iron-800/50 tw-border-solid tw-border-x-0 tw-border-b-0">
            <div className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-xs tw-text-iron-500">Category</span>
              <span className="tw-text-xs tw-text-iron-300">{outcome.rep_category}</span>
            </div>
          </div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-border-t tw-border-iron-800/50 tw-border-solid tw-border-x-0 tw-border-b-0">
              {visibleItems.map((item, i) => (
                <div
                  key={`wave-rep-outcome-${item.index}`}
                  className="tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between tw-transition-colors desktop-hover:hover:tw-bg-white/[0.02]"
                >
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-flex tw-items-center tw-justify-center tw-size-6 tw-rounded-md tw-bg-iron-900 tw-text-iron-400 tw-text-xs tw-font-medium">
                      {i + 1}
                    </span>
                    <span className="tw-text-sm tw-text-iron-200">
                      {formatNumberWithCommas(item.amount ?? 0)} Rep
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-text-iron-500">
                  Loading winners...
                </div>
              )}

              {isError && (
                <div className="tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-text-red-400">
                  {errorMessage || "Failed to load winners"}
                </div>
              )}

              {!isLoading && !isError && items.length === 0 && (
                <div className="tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-text-iron-500">
                  No winners yet
                </div>
              )}

              {shouldShowMore && (
                <button
                  className="tw-border-0 tw-w-full tw-px-4 tw-py-3 tw-text-sm tw-text-iron-500 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent tw-transition-colors tw-cursor-pointer"
                  onClick={onViewMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : `View ${remainingCount} more`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
