"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimeline } from "./HorizontalTimeline";

interface ExpandedTimelineContentProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly onLoadMorePast?: () => void;
  readonly onLoadMoreFuture?: () => void;
  readonly hasMorePast?: boolean;
  readonly hasMoreFuture?: boolean;
  readonly remainingPastCount?: number | null;
  readonly remainingFutureCount?: number | null;
  readonly focus?: "start" | "end" | null;
  readonly onFocusHandled?: () => void;
}

/**
 * Renders the expanded content of the timeline
 */
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
    hasMorePast && decisions.length > 0 ? decisions[0]?.id ?? null : null;

  const pastCountToDisplay =
    remainingPastCount != null && remainingPastCount > 0
      ? remainingPastCount
      : earliestDecisionIndex;

  const formatLabel = (count: number | null, direction: "earlier" | "later") => {
    if (count == null) {
      return direction === "earlier" ? "Show earlier" : "Show later";
    }

    if (count <= 0) {
      return direction === "earlier" ? "Show earlier" : "Show later";
    }

    const noun = direction === "earlier" ? "earlier" : "later";
    return `Show ${count} ${noun}`;
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setAnimationComplete(true)}
      className="tw-bg-iron-950">
      {/* Horizontal Timeline View */}
      <div className="tw-px-3 tw-py-4">
        {(hasMorePast || hasMoreFuture) && (
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pb-3 tw-text-xs tw-text-iron-300">
            <div className="tw-flex tw-items-center tw-gap-2">
              {hasMorePast && onLoadMorePast && (
                <button
                  type="button"
                  onClick={onLoadMorePast}
                  className="tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-iron-400 tw-transition-colors"
                >
                  {formatLabel(pastCountToDisplay, "earlier")}
                </button>
              )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              {hasMoreFuture && onLoadMoreFuture && (
                <button
                  type="button"
                  onClick={onLoadMoreFuture}
                  className="tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-iron-400 tw-transition-colors"
                >
                  {formatLabel(remainingFutureCount, "later")}
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
