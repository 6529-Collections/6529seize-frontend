"use client";

import type { FC, ReactNode } from "react";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ApiWaveOutcomeDistributionItem } from "@/generated/models/ApiWaveOutcomeDistributionItem";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { WaveOutcomeDistributionState } from "@/types/waves.types";

interface WaveOutcomePool {
  readonly amount: number;
  readonly className: string;
}

interface WaveOutcomeMetadata {
  readonly label: string;
  readonly value: string;
}

interface WaveOutcomeAccordionProps {
  readonly title: string;
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly itemKeyPrefix: string;
  readonly distribution: WaveOutcomeDistributionState | undefined;
  readonly renderItem: (item: ApiWaveOutcomeDistributionItem) => ReactNode;
  readonly pool?: WaveOutcomePool;
  readonly metadata?: WaveOutcomeMetadata | undefined;
}

const DEFAULT_AMOUNTS_TO_SHOW = 3;
const OUTCOME_EYEBROW_CLASSES =
  "tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wide tw-text-iron-500";

export const WaveOutcomeAccordion: FC<WaveOutcomeAccordionProps> = ({
  title,
  icon,
  iconClassName,
  itemKeyPrefix,
  distribution,
  renderItem,
  pool,
  metadata,
}) => {
  const panelId = useId();
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
  const visibleItems = showAll
    ? items
    : items.slice(0, DEFAULT_AMOUNTS_TO_SHOW);
  const remainingCount = Math.max(totalCount - visibleItems.length, 0);
  const shouldShowMore =
    hasNextPage || (!showAll && items.length > DEFAULT_AMOUNTS_TO_SHOW);
  const resolvedErrorMessage =
    typeof errorMessage === "string" && errorMessage.length > 0
      ? errorMessage
      : "Failed to load winners";
  const viewMoreLabel = getViewMoreLabel({
    isFetching: isFetchingNextPage,
    remainingCount,
  });

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
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-[13px] tw-py-[21px] tw-text-left focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/80 sm:tw-px-[21px]"
      >
        <div className="tw-grid tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center tw-gap-[13px]">
          <div
            className={`tw-flex tw-size-[34px] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid ${iconClassName}`}
          >
            {icon}
          </div>
          <div className="tw-min-w-0">
            <div className="tw-text-base tw-font-semibold tw-leading-5 tw-tracking-[-0.015em] tw-text-iron-50 sm:tw-text-lg sm:tw-leading-6">
              {title}
            </div>
            <div className={`tw-mt-[5px] ${OUTCOME_EYEBROW_CLASSES}`}>
              {isLoading ? (
                <span className="tw-inline-block tw-h-[13px] tw-w-[55px] tw-animate-pulse tw-rounded tw-bg-iron-800" />
              ) : (
                <>
                  {formatNumberWithCommas(totalCount)}{" "}
                  {totalCount === 1 ? "winner" : "winners"}
                </>
              )}
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-[13px]">
            {pool && (
              <div className="tw-text-right">
                <div
                  className={`tw-text-lg tw-font-medium tw-leading-6 tw-tracking-[-0.015em] ${pool.className}`}
                >
                  {formatNumberWithCommas(pool.amount)}
                </div>
                <div className={`tw-mt-[3px] ${OUTCOME_EYEBROW_CLASSES}`}>
                  total pool
                </div>
              </div>
            )}
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
      {metadata && (
        <div className="tw-mx-[13px] tw-grid tw-gap-[8px] tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pb-[21px] tw-pt-[13px] sm:tw-mx-[21px] sm:tw-grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)] sm:tw-items-baseline sm:tw-gap-[21px]">
          <span className={OUTCOME_EYEBROW_CLASSES}>
            {metadata.label}
          </span>
          <span className="tw-text-sm tw-leading-5 tw-text-iron-200 sm:tw-text-right">
            {metadata.value}
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            layout
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -5 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06]">
              {visibleItems.map((item, index) => (
                <div
                  key={`${itemKeyPrefix}-${item.index}`}
                  className="tw-grid tw-grid-cols-[34px_minmax(0,1fr)] tw-items-center tw-gap-[13px] tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-px-[13px] tw-py-[13px] tw-transition-colors first:tw-border-t-0 desktop-hover:hover:tw-bg-white/[0.02] sm:tw-px-[21px]"
                >
                  <span className="tw-text-[10px] tw-font-medium tw-leading-[13px] tw-tracking-[0.14em] tw-text-iron-500">
                    {index + 1}
                  </span>
                  <span className="tw-text-sm tw-leading-5 tw-text-iron-200">
                    {renderItem(item)}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="tw-px-[13px] tw-py-[21px] tw-text-sm tw-text-iron-500 sm:tw-px-[21px]">
                  Loading winners...
                </div>
              )}

              {isError && (
                <div className="tw-text-red-400 tw-px-[13px] tw-py-[21px] tw-text-sm sm:tw-px-[21px]">
                  {resolvedErrorMessage}
                </div>
              )}

              {!isLoading && !isError && items.length === 0 && (
                <div className="tw-px-[13px] tw-py-[21px] tw-text-sm tw-text-iron-500 sm:tw-px-[21px]">
                  No winners yet
                </div>
              )}

              {shouldShowMore && (
                <button
                  type="button"
                  className="tw-min-h-11 tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-[13px] tw-py-[13px] tw-text-sm tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/80 desktop-hover:hover:tw-text-iron-300 sm:tw-px-[21px]"
                  onClick={onViewMore}
                  disabled={isFetchingNextPage}
                >
                  {viewMoreLabel}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getViewMoreLabel = ({
  isFetching,
  remainingCount,
}: {
  readonly isFetching: boolean;
  readonly remainingCount: number;
}) => {
  if (isFetching) {
    return "Loading...";
  }
  return remainingCount > 0 ? `View ${remainingCount} more` : "View more";
};
