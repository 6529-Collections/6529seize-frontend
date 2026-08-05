"use client";

import Button from "@/components/utils/button/Button";
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

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setAnimationComplete(true)}
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-bg-black/15"
    >
      <div className="tw-px-3 tw-py-3">
        {(hasMorePast || hasMoreFuture) && (
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pb-3 tw-text-xs tw-text-iron-400">
            <div className="tw-flex tw-items-center tw-gap-2">
              {hasMorePast && onLoadMorePast && (
                <Button
                  type="button"
                  onClick={onLoadMorePast}
                  variant="tertiary"
                  size="xs"
                  className="!tw-h-7 !tw-rounded-md !tw-border-white/[0.06] !tw-bg-white/[0.025] !tw-px-2.5 !tw-text-[11px] !tw-font-medium !tw-text-iron-400 !tw-shadow-none desktop-hover:hover:!tw-border-white/10 desktop-hover:hover:!tw-bg-white/[0.05] desktop-hover:hover:!tw-text-iron-200"
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="tw-size-3 tw-flex-shrink-0"
                  />
                  <span className="tw-whitespace-nowrap">
                    {formatLabel(pastCountToDisplay, "earlier")}
                  </span>
                </Button>
              )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              {hasMoreFuture && onLoadMoreFuture && (
                <Button
                  type="button"
                  onClick={onLoadMoreFuture}
                  variant="tertiary"
                  size="xs"
                  className="!tw-h-7 !tw-rounded-md !tw-border-white/[0.06] !tw-bg-white/[0.025] !tw-px-2.5 !tw-text-[11px] !tw-font-medium !tw-text-iron-400 !tw-shadow-none desktop-hover:hover:!tw-border-white/10 desktop-hover:hover:!tw-bg-white/[0.05] desktop-hover:hover:!tw-text-iron-200"
                >
                  <span className="tw-whitespace-nowrap">
                    {formatLabel(remainingFutureCount, "later")}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="tw-size-3 tw-flex-shrink-0"
                  />
                </Button>
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
