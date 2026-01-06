"use client";

import React, { useEffect, useRef } from "react";
import type { DecisionPoint } from "@/helpers/waves/time.types";
import { HorizontalTimelineItem } from "./HorizontalTimelineItem";

interface HorizontalTimelineProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly animationComplete?: boolean | undefined;
  readonly focus?: "start" | "end" | null | undefined;
  readonly onFocusHandled?: (() => void) | undefined;
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
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const handledFocusRef = useRef<"start" | "end" | null>(null);

  // Effect to scroll to the next decision or the end
  useEffect(() => {
    if (!scrollContainerRef.current || !animationComplete) return;

    let frameId: number | null = null;

    const cleanup = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };

    const markFocusHandled = (value: "start" | "end") => {
      handledFocusRef.current = value;
      onFocusHandled?.();
    };

    const handleFocusScroll = () => {
      if (!focus) {
        return false;
      }

      if (decisions.length === 0) {
        markFocusHandled(focus);
        return true;
      }

      const targetDecision = decisions.at(focus === "start" ? 0 : -1);

      const attemptScroll = () => {
        const targetElement =
          targetDecision && itemRefs.current[targetDecision.id];

        if (targetDecision && targetElement) {
          markFocusHandled(focus);
          frameId = null;
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: focus === "start" ? "start" : "end",
          });
          return;
        }

        frameId = requestAnimationFrame(attemptScroll);
      };

      attemptScroll();
      return true;
    };

    const resetHandledFocus = () => {
      if (!handledFocusRef.current) {
        return false;
      }

      handledFocusRef.current = null;
      return true;
    };

    const scrollToDecision = (
      decision: DecisionPoint | undefined,
      inline: ScrollLogicalPosition
    ) => {
      if (!decision) {
        return false;
      }

      const element = itemRefs.current[decision.id];

      if (!element) {
        return false;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline,
      });

      return true;
    };

    const scrollToNextDecision = () => {
      const index = decisions.findIndex(
        (decision) => decision.timestamp === nextDecisionTime
      );

      if (index === -1) {
        return false;
      }

      const anchorIndex = Math.max(index - 3, 0);
      const anchorDecision = decisions[anchorIndex];

      if (
        scrollToDecision(
          anchorDecision,
          anchorIndex === index ? "center" : "start"
        )
      ) {
        return true;
      }

      return scrollToDecision(decisions[index], "center");
    };

    const scrollToLastDecision = () => {
      if (decisions.length === 0 || shouldSpread) {
        return false;
      }

      const lastDecision = decisions[decisions.length - 1];
      return scrollToDecision(lastDecision, "end");
    };

    if (
      handleFocusScroll() ||
      resetHandledFocus() ||
      scrollToNextDecision() ||
      scrollToLastDecision()
    ) {
      return cleanup;
    }

    return cleanup;
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
          className="tw-overflow-x-auto tw-pb-2 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
        >
          <div
            className={`tw-flex tw-gap-4 ${
              shouldSpread ? "tw-w-full" : "tw-max-w-20"
            }`}
          >
            {decisions.map((decision) => {
              const isNext =
                !!nextDecisionTime && decision.timestamp === nextDecisionTime;

              return (
                <div
                  key={decision.id}
                  ref={(el) => {
                    itemRefs.current[decision.id] = el;
                  }}
                >
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
