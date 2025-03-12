import React from "react";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { TimeLeft, isTimeZero } from "../../../../helpers/waves/time.utils";
import { TimeCountdownDisplay } from "./TimeCountdownDisplay";
import { AnimatedAccordionContent } from "../../../../components/common/AnimatedAccordionContent";
import { DecisionTimelineHeader } from "./DecisionTimelineHeader";
import { DecisionTimelineList } from "./DecisionTimelineList";

interface DecisionTimelineProps {
  readonly nextDecisionTime: number | null;
  readonly nextDecisionTimeLeft: TimeLeft;
  readonly upcomingDecisions: DecisionPoint[];
  readonly allDecisions: DecisionPoint[];
  readonly isRollingWave: boolean;
  readonly isDecisionDetailsOpen: boolean;
  readonly setIsDecisionDetailsOpen: (isOpen: boolean) => void;
}

/**
 * Displays the decision timeline for a wave, showing upcoming and past decision points
 */
export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  nextDecisionTime,
  nextDecisionTimeLeft,
  upcomingDecisions,
  allDecisions,
  isRollingWave,
  isDecisionDetailsOpen,
  setIsDecisionDetailsOpen,
}) => {
  const hasNextDecision = 
    !!nextDecisionTime && 
    !!nextDecisionTimeLeft && 
    !isTimeZero(nextDecisionTimeLeft);

  return (
    <div className="tw-rounded-lg tw-shadow-lg tw-shadow-primary-500/10 tw-transition-all tw-duration-300 tw-bg-gradient-to-br tw-from-[#1E1E2E]/80 tw-via-[#2E2E3E]/60 tw-to-[#3E2E3E]/40 tw-backdrop-blur-sm tw-border tw-border-[#3E2E3E]/20">
      <DecisionTimelineHeader
        isOpen={isDecisionDetailsOpen}
        setIsOpen={setIsDecisionDetailsOpen}
        icon={faClock}
        timeLeft={nextDecisionTimeLeft}
        hasNextDecision={hasNextDecision}
      />

      <AnimatedAccordionContent
        isVisible={isDecisionDetailsOpen && hasNextDecision}
        duration={0.3}
      >
        <div className="tw-px-4 tw-pt-2">
          <TimeCountdownDisplay timeLeft={nextDecisionTimeLeft} size="small" />
        </div>
      </AnimatedAccordionContent>

      <AnimatedAccordionContent
        isVisible={isDecisionDetailsOpen}
        duration={0.3}
      >
        <div className="tw-mt-2 tw-px-4 tw-pb-3">
          <DecisionTimelineList
            decisions={allDecisions}
            nextDecisionTime={nextDecisionTime}
            isRollingWave={isRollingWave}
          />
        </div>
      </AnimatedAccordionContent>
    </div>
  );
};
