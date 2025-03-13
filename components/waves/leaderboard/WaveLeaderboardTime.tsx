import React, { useEffect, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { AnimatePresence, motion } from "framer-motion";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { TimelineToggleHeader } from "./time/TimelineToggleHeader";
import { ExpandedTimelineContent } from "./time/ExpandedTimelineContent";
import { isTimeZero } from "../../../helpers/waves/time.utils";
import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";

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

  const [hasNextDecision, setHasNextDecision] = useState(false);
  
  // Check if this is a memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  // Check if this is a wave with at least one decision point
  const hasDecisionPoints = !!wave.wave.decisions_strategy?.first_decision_time;
  
  // Get wave type - showing compact cards for simple rank waves
  const isRankWave = wave.wave.type === "RANK";
  
  // Only show timeline for multi-decision waves, the memes wave, or waves with past decisions
  const shouldShowTimeline = isMultiDecisionWave || isMemesWave || 
    (hasDecisionPoints && nextDecisionTime === null && allDecisions.some(d => d.isPast));

  useEffect(() => {
    setHasNextDecision(
      !!nextDecisionTime &&
        !!nextDecisionTimeLeft &&
        !isTimeZero(nextDecisionTimeLeft)
    );
  }, [nextDecisionTime, nextDecisionTimeLeft]);

  return (
    <div className="tw-mb-4">
      {shouldShowTimeline ? (
        // For multi-decision and memes waves: Show expandable timeline
        <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
          {/* Timeline header with title and countdown */}
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
      ) : (
        // For regular waves: Show phase cards directly in the header
        <div className="tw-rounded-lg tw-bg-iron-950 tw-px-3 tw-py-2 tw-overflow-hidden">
          <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-justify-between">
            <CompactDroppingPhaseCard wave={wave} />
            <CompactVotingPhaseCard wave={wave} />
          </div>
        </div>
      )}
    </div>
  );
};
