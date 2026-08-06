"use client";

import type { FC} from "react";
import { useState } from "react";
import type { ApiWaveOutcome } from "@/generated/models/ApiWaveOutcome";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IdentificationIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface WaveNICOutcomeProps {
  readonly outcome: ApiWaveOutcome;
  readonly distribution: WaveOutcomeDistributionState;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;

export const WaveNICOutcome: FC<WaveNICOutcomeProps> = ({
  outcome,
  distribution,
}) => {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const {
    items = [],
    totalCount = 0,
    hasNextPage = false,
    isFetchingNextPage = false,
    fetchNextPage = () => undefined,
    isLoading = false,
    isError = false,
    errorMessage,
  } = distribution ?? {};
  const winnersCount = totalCount;
  const visibleItems = showAll
    ? items
    : items.slice(0, DEFAULT_AMOUNTS_TO_SHOW);
  const remainingCount = Math.max(totalCount - visibleItems.length, 0);
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
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/85 tw-shadow-[0_18px_45px_-32px_rgba(0,0,0,0.95)] tw-transition-colors tw-duration-200 desktop-hover:hover:tw-border-white/[0.14]">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-[13px] tw-py-[21px] tw-text-left focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/80 sm:tw-px-[21px]"
      >
        <div className="tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center tw-gap-[13px]">
          <div className="tw-flex tw-size-[34px] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-[#A4C2DB]/20 tw-bg-[#A4C2DB]/[0.05]">
            <IdentificationIcon
              className="tw-size-4 tw-text-[#A4C2DB]"
              aria-hidden="true"
            />
          </div>
          <div className="tw-min-w-0">
            <div className="tw-text-base tw-font-semibold tw-leading-5 tw-tracking-[-0.015em] tw-text-iron-50 sm:tw-text-lg sm:tw-leading-6">
              NIC
            </div>
            <div className="tw-mt-[5px] tw-text-[10px] tw-font-medium tw-uppercase tw-leading-[13px] tw-tracking-[0.16em] tw-text-iron-500">
              {isLoading ? (
                <span className="tw-inline-block tw-h-[13px] tw-w-[55px] tw-animate-pulse tw-rounded tw-bg-iron-800" />
              ) : (
                <>
                  {formatNumberWithCommas(winnersCount)}{" "}
                  {winnersCount === 1 ? "winner" : "winners"}
                </>
              )}
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-[13px]">
            <div className="tw-text-right">
              <div className="tw-text-lg tw-font-medium tw-leading-6 tw-tracking-[-0.015em] tw-text-[#A4C2DB]">
                {formatNumberWithCommas(outcome.amount ?? 0)}
              </div>
              <div className="tw-mt-[3px] tw-text-[10px] tw-font-medium tw-uppercase tw-leading-[13px] tw-tracking-[0.14em] tw-text-iron-500">
                total pool
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="tw-flex tw-size-[34px] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.08]"
            >
              <ChevronDownIcon
                className="tw-size-4 tw-text-iron-500"
                aria-hidden="true"
              />
            </motion.div>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06]">
              {visibleItems.map((item, i) => (
                <div
                  key={`wave-nic-outcome-${item.index}`}
                  className="tw-grid tw-grid-cols-[34px_minmax(0,1fr)] tw-items-center tw-gap-[13px] tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-px-[13px] tw-py-[13px] tw-transition-colors first:tw-border-t-0 desktop-hover:hover:tw-bg-white/[0.02] sm:tw-px-[21px]"
                >
                  <span className="tw-text-[10px] tw-font-medium tw-leading-[13px] tw-tracking-[0.14em] tw-text-iron-500">
                    {i + 1}
                  </span>
                  <span className="tw-text-sm tw-leading-5 tw-text-iron-200">
                    {formatNumberWithCommas(item.amount ?? 0)} NIC
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="tw-px-[13px] tw-py-[21px] tw-text-sm tw-text-iron-500 sm:tw-px-[21px]">
                  Loading winners...
                </div>
              )}

              {isError && (
                <div className="tw-px-[13px] tw-py-[21px] tw-text-sm tw-text-red-400 sm:tw-px-[21px]">
                  {errorMessage || "Failed to load winners"}
                </div>
              )}

              {!isLoading && !isError && items.length === 0 && (
                <div className="tw-px-[13px] tw-py-[21px] tw-text-sm tw-text-iron-500 sm:tw-px-[21px]">
                  No winners yet
                </div>
              )}

              {shouldShowMore && (
                <button
                  onClick={onViewMore}
                  className="tw-min-h-11 tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-[13px] tw-py-[13px] tw-text-sm tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/80 desktop-hover:hover:tw-text-iron-300 sm:tw-px-[21px]"
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
