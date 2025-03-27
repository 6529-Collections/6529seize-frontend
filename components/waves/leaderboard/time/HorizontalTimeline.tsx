import React, { useEffect, useRef } from "react";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimelineItem } from "./HorizontalTimelineItem";

interface HorizontalTimelineProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly animationComplete?: boolean;
}

/**
 * Renders a horizontal timeline with decision points
 */
export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  decisions,
  nextDecisionTime,
  animationComplete = false,
}) => {
  // Calculate whether we should use flex-grow or fixed width
  // If we have few items (less than would cause scrolling), we want them to spread out
  const shouldSpread = decisions.length <= 5; // Adjust this number as needed
  
  // Create a container ref for the scrollable area
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Create refs for each timeline item
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Effect to scroll to the next decision or the end
  useEffect(() => {
    // Only attempt to scroll if animation is complete
    if (!scrollContainerRef.current || !animationComplete) return;
    
    // Find the next decision
    const nextDecision = decisions.find(
      (decision) => decision.timestamp === nextDecisionTime
    );
    
    if (nextDecision && itemRefs.current[nextDecision.id]) {
      // Scroll to the next decision
      itemRefs.current[nextDecision.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    } else if (decisions.length > 0 && !shouldSpread) {
      // If no next decision, scroll to the last item
      const lastDecision = decisions[decisions.length - 1];
      itemRefs.current[lastDecision.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'end'
      });
    }
  }, [decisions, nextDecisionTime, shouldSpread, animationComplete]);

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
