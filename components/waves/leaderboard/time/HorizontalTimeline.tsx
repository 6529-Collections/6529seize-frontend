import React, { useEffect, useRef } from "react";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimelineItem } from "./HorizontalTimelineItem";
import { ApiWaveDecisionPause } from "../../../../generated/models/ApiWaveDecisionPause";

interface HorizontalTimelineProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly animationComplete?: boolean;
  readonly pauses?: ApiWaveDecisionPause[];
}

/**
 * Renders a horizontal timeline with decision points
 */
export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  decisions,
  nextDecisionTime,
  animationComplete = false,
  pauses = [],
}) => {
  // Calculate whether we should use flex-grow or fixed width
  // If we have few items (less than would cause scrolling), we want them to spread out
  const shouldSpread = decisions.length <= 5; // Adjust this number as needed
  
  // Create a container ref for the scrollable area
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Create refs for each timeline item
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Helper function to check if a decision falls within a pause period
  const isDecisionDuringPause = (decisionTime: number): boolean => {
    return pauses.some(pause => 
      decisionTime >= pause.start_time && decisionTime <= pause.end_time
    );
  };
  
  // Helper function to get pause that affects the area between two decisions
  const getPauseBetweenDecisions = (decision1: DecisionPoint, decision2: DecisionPoint): ApiWaveDecisionPause | null => {
    return pauses.find(pause => 
      (pause.start_time >= decision1.timestamp && pause.start_time <= decision2.timestamp) ||
      (pause.end_time >= decision1.timestamp && pause.end_time <= decision2.timestamp) ||
      (pause.start_time <= decision1.timestamp && pause.end_time >= decision2.timestamp)
    ) || null;
  };
  
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
            {decisions.map((decision, index) => {
              const isNext =
                !!nextDecisionTime && decision.timestamp === nextDecisionTime;
              const isDuringPause = isDecisionDuringPause(decision.timestamp);

              return (
                <React.Fragment key={decision.id}>
                  <div 
                    ref={(el) => {
                      itemRefs.current[decision.id] = el;
                    }}
                  >
                    <HorizontalTimelineItem
                      decision={decision}
                      isNext={isNext}
                      flexGrow={shouldSpread}
                      isDuringPause={isDuringPause}
                    />
                  </div>
                  
                  {/* Show pause indicator between decisions if needed */}
                  {index < decisions.length - 1 && (() => {
                    const nextDecision = decisions[index + 1];
                    const pauseBetween = getPauseBetweenDecisions(decision, nextDecision);
                    
                    if (pauseBetween && !isDuringPause && !isDecisionDuringPause(nextDecision.timestamp)) {
                      return (
                        <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-z-10">
                          <div className="tw-bg-yellow-500/20 tw-rounded tw-px-2 tw-py-1">
                            <span className="tw-text-yellow-400 tw-text-[10px]">⏸</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </React.Fragment>
              );
            })}
            <div className="tw-absolute tw-h-0.5 tw-bg-iron-800 tw-left-0 tw-right-0 tw-top-[20px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
