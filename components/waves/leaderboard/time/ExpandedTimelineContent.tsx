"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { DecisionPoint } from "@/helpers/waves/time.types";
import { HorizontalTimeline } from "./HorizontalTimeline";

interface ExpandedTimelineContentProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly onLoadMorePast?: (() => void) | undefined;
  readonly onLoadMoreFuture?: (() => void) | undefined;
  readonly hasMorePast?: boolean | undefined;
  readonly hasMoreFuture?: boolean | undefined;
  readonly remainingPastCount?: number | null | undefined;
  readonly remainingFutureCount?: number | null | undefined;
  readonly focus?: "start" | "end" | null | undefined;
  readonly onFocusHandled?: (() => void) | undefined;
}

export const ExpandedTimelineContent: React.FC<
  ExpandedTimelineContentProps
> = ({
  decisions,
  nextDecisionTime,
  onLoadMorePast,
  onLoadMoreFuture,
  hasMorePast = false,
  hasMoreFuture = false,
  remainingPastCount = null,
  remainingFutureCount = null,
  focus = null,
  onFocusHandled,
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  const earliestDecisionIndex =
    hasMorePast && decisions.length > 0
      ? decisions[0]?.seriesIndex ?? null
      : null;

  const pastCountToDisplay =
    remainingPastCount != null && remainingPastCount > 0
      ? remainingPastCount
      : earliestDecisionIndex;

  const formatLabel = (
    count: number | null,
    direction: "earlier" | "later"
  ) => {
    if (count == null) {
      return direction === "earlier" ? "Show earlier" : "Show later";
    }

    if (count <= 0) {
      return direction === "earlier" ? "Show earlier" : "Show later";
    }

    const noun = direction === "earlier" ? "earlier" : "later";
    return `Show ${count} ${noun}`;
  };

  const loadMoreButtonClasses =
    "tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/60 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-100 tw-shadow-sm tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-border-iron-600/70 desktop-hover:hover:tw-bg-iron-700/60 desktop-hover:hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-500";

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setAnimationComplete(true)}
      className="tw-bg-iron-950"
    >
      <div className="tw-px-3 tw-py-4">
        {(hasMorePast || hasMoreFuture) && (
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pb-3 tw-text-xs tw-text-iron-300">
            <div className="tw-flex tw-items-center tw-gap-2">
              {hasMorePast && onLoadMorePast && (
                <button
                  type="button"
                  onClick={onLoadMorePast}
                  className={loadMoreButtonClasses}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="tw-size-4 tw-flex-shrink-0"
                  />
                  <span className="tw-whitespace-nowrap">
                    {formatLabel(pastCountToDisplay, "earlier")}
                  </span>
                </button>
              )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              {hasMoreFuture && onLoadMoreFuture && (
                <button
                  type="button"
                  onClick={onLoadMoreFuture}
                  className={loadMoreButtonClasses}
                >
                  <span className="tw-whitespace-nowrap">
                    {formatLabel(remainingFutureCount, "later")}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="tw-size-4 tw-flex-shrink-0"
                  />
                </button>
              )}
            </div>
          </div>
        )}
        <HorizontalTimeline
          decisions={decisions}
          nextDecisionTime={nextDecisionTime}
          animationComplete={animationComplete}
          focus={focus}
          onFocusHandled={onFocusHandled}
        />
      </div>
    </motion.div>
  );
};
