import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { AnimatePresence } from "framer-motion";
import { faClock } from "@fortawesome/free-regular-svg-icons";
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
  } = useWave(wave);

  // Track expanded/collapsed state for decision details
  const [isDecisionDetailsOpen, setIsDecisionDetailsOpen] =
    useState<boolean>(false);

  const nextDecisionTime =
    allDecisions.find((decision) => decision.timestamp > Time.currentMillis())
      ?.timestamp ?? null;


  return (
    <div className="tw-mb-2 lg:tw-mb-4">
      {multiDecision ? (
        // For multi-decision and memes waves: Show expandable timeline
        <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
          {/* Timeline header with title and countdown */}
          <TimelineToggleHeader
            icon={faClock}
            isOpen={isDecisionDetailsOpen}
            setIsOpen={setIsDecisionDetailsOpen}
            nextDecisionTime={nextDecisionTime}
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
