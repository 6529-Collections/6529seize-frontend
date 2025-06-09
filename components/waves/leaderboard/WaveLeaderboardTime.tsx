import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { AnimatePresence } from "framer-motion";
import { TimelineToggleHeader } from "./time/TimelineToggleHeader";
import { ExpandedTimelineContent } from "./time/ExpandedTimelineContent";
import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";
import { useWave } from "../../../hooks/useWave";
import { Time } from "../../../helpers/time";

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
  const { allDecisions } = useDecisionPoints(wave);
  const {
    decisions: { multiDecision },
    pauses: { isPaused, currentPause },
  } = useWave(wave);


  // Track expanded/collapsed state for decjusision details
  const [isDecisionDetailsOpen, setIsDecisionDetailsOpen] =
    useState<boolean>(false);

  // Filter out decisions that occur during pause periods
  const filteredDecisions = allDecisions.filter(decision => {
    if (!wave.pauses || wave.pauses.length === 0) return true;
    
    // Check if this decision falls within any pause period
    // Both timestamps should be in milliseconds
    return !wave.pauses.some(pause => {
      const decisionTime = decision.timestamp;
      const pauseStart = pause.start_time;
      const pauseEnd = pause.end_time;
      
      // Decision is excluded if it falls within the pause period
      return decisionTime >= pauseStart && decisionTime <= pauseEnd;
    });
  });

  // Get the next valid decision time (excluding paused decisions)
  const nextDecisionTime =
    filteredDecisions.find((decision) => decision.timestamp > Time.currentMillis())
      ?.timestamp ?? null;



  return (
    <div className="tw-mb-2 lg:tw-mb-4">
      {multiDecision ? (
        // For multi-decision and memes waves: Show expandable timeline
        <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
          {/* Timeline header with title and countdown */}
          <TimelineToggleHeader
            isOpen={isDecisionDetailsOpen}
            setIsOpen={setIsDecisionDetailsOpen}
            nextDecisionTime={nextDecisionTime}
            isPaused={isPaused}
            currentPause={currentPause}
          />

          {/* Expandable timeline section */}
          <AnimatePresence>
            {isDecisionDetailsOpen && (
              <ExpandedTimelineContent
                decisions={allDecisions}
                nextDecisionTime={nextDecisionTime}
                pauses={wave.pauses}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        // For regular waves: Show phase cards directly in the header
        <div className="tw-rounded-lg tw-bg-iron-950 tw-px-3 tw-py-2 tw-overflow-hidden">
          <div className="tw-flex tw-items-center tw-gap-2">
            <CompactDroppingPhaseCard wave={wave} />
            <CompactVotingPhaseCard wave={wave} />
          </div>
        </div>
      )}
    </div>
  );
};
