"use client";

import React, { useEffect, useRef } from "react";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimelineItem } from "./HorizontalTimelineItem";

interface HorizontalTimelineProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly animationComplete?: boolean;
  readonly focus?: "start" | "end" | null;
  readonly onFocusHandled?: () => void;
}

/**
 * Renders a horizontal timeline with decision points
 */
export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  decisions,
  nextDecisionTime,
  animationComplete = false,
  focus = null,
  onFocusHandled,
}) => {
  // Calculate whether we should use flex-grow or fixed width
  // If we have few items (less than would cause scrolling), we want them to spread out
  const shouldSpread = decisions.length <= 5; // Adjust this number as needed

  // Create a container ref for the scrollable area
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Create refs for each timeline item
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Track whether we just handled a focus-driven scroll to avoid immediately
  // overriding the user's intent with automated scrolling logic
  const handledFocusRef = useRef<"start" | "end" | null>(null);

  // Effect to scroll to the next decision or the end
  useEffect(() => {
    // Only attempt to scroll if animation is complete
    if (!scrollContainerRef.current || !animationComplete) return;

    if (focus && decisions.length === 0) {
      handledFocusRef.current = focus;
      onFocusHandled?.();
      return;
    }

    if (focus && decisions.length > 0) {
      const targetDecision =
        focus === "start" ? decisions[0] : decisions[decisions.length - 1];
      const targetElement =
        targetDecision && itemRefs.current[targetDecision.id];

      if (targetDecision && targetElement) {
        handledFocusRef.current = focus;
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: focus === "start" ? "start" : "end",
        });
        onFocusHandled?.();
        return;
      }
      // Wait for refs to populate before clearing focus
      return;
    }

    if (handledFocusRef.current) {
      handledFocusRef.current = null;
      return;
    }

    // Find the next decision
    const nextDecisionIndex = decisions.findIndex(
      (decision) => decision.timestamp === nextDecisionTime
    );

    if (nextDecisionIndex !== -1) {
      const anchorIndex = Math.max(nextDecisionIndex - 3, 0);
      const anchorDecision = decisions[anchorIndex];
      const anchorRef = anchorDecision ? itemRefs.current[anchorDecision.id] : null;

      if (anchorRef) {
        // Bias the scroll so earlier decisions remain immediately visible
        anchorRef.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: anchorIndex === nextDecisionIndex ? "center" : "start",
        });
        return;
      }

      const nextDecision = decisions[nextDecisionIndex];
      const nextRef = itemRefs.current[nextDecision.id];

      if (nextRef) {
        nextRef.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
        return;
      }
    } else if (decisions.length > 0 && !shouldSpread) {
      // If no next decision, scroll to the last item
      const lastDecision = decisions[decisions.length - 1];
      itemRefs.current[lastDecision.id]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "end",
      });
    }
  }, [
    decisions,
    nextDecisionTime,
    shouldSpread,
    animationComplete,
    focus,
    onFocusHandled,
  ]);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg">
      <div className="tw-relative">
        <div
          ref={scrollContainerRef}
          className="tw-overflow-x-auto tw-pb-2 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div
            className={`tw-flex tw-gap-4 ${
              shouldSpread ? "tw-w-full" : "tw-max-w-20"
            }`}>
            {decisions.map((decision) => {
              const isNext =
                !!nextDecisionTime && decision.timestamp === nextDecisionTime;

              return (
                <div
                  key={decision.id}
                  ref={(el) => {
                    itemRefs.current[decision.id] = el;
                  }}>
                  <HorizontalTimelineItem
                    decision={decision}
                    isNext={isNext}
                    flexGrow={shouldSpread}
                  />
                </div>
              );
            })}
            <div className="tw-absolute tw-h-0.5 tw-bg-iron-800 tw-left-0 tw-right-0 tw-top-[20px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
