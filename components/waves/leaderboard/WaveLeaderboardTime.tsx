import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { AnimatePresence } from "framer-motion";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { TimelineToggleHeader } from "./time/TimelineToggleHeader";
import { ExpandedTimelineContent } from "./time/ExpandedTimelineContent";
import { isTimeZero } from "../../../helpers/waves/time.utils";
// Import only CompactDroppingPhaseCard and CompactVotingPhaseCard
// but comment them out for now
// import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
// import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

/**
 * Component for displaying wave time information focusing on next winner announcement
 * in a compact format with expandable timeline
 */
export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
  // Using decision points hooks
  const {
    isMultiDecisionWave,
    isRollingWave,
    isDecisionDetailsOpen,
    setIsDecisionDetailsOpen,
    nextDecisionTime,
    upcomingDecisions,
    allDecisions,
    nextDecisionTimeLeft,
  } = useDecisionPoints(wave);

  // Check if we have an upcoming next decision
  const hasNextDecision = 
    !!nextDecisionTime && 
    !!nextDecisionTimeLeft && 
    !isTimeZero(nextDecisionTimeLeft);

  return (
    <div className="tw-mb-4">
      {/* Main container */}
      <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
        {/* Header section with title, countdown and date */}
        <TimelineToggleHeader
          icon={faClock}
          isOpen={isDecisionDetailsOpen}
          setIsOpen={setIsDecisionDetailsOpen}
          hasNextDecision={hasNextDecision}
          nextDecisionTime={nextDecisionTime}
          timeLeft={nextDecisionTimeLeft}
        />

        {/* Expandable timeline section */}
        <AnimatePresence>
          {isDecisionDetailsOpen && (
            <ExpandedTimelineContent
              decisions={allDecisions}
              nextDecisionTime={nextDecisionTime}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Commented out phase cards 
      <div className="tw-flex tw-items-center tw-flex-wrap tw-mt-2 tw-gap-y-1">
        <CompactDroppingPhaseCard wave={wave} />
        <div className="tw-mt-1">
          <div className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-white/20"></div>
        </div>
        <CompactVotingPhaseCard wave={wave} />
      </div>
      */}
    </div>
  );
};
