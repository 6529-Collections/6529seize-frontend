import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { DroppingPhaseCard } from "./time/DroppingPhaseCard";
import { VotingPhaseCard } from "./time/VotingPhaseCard";
import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";
import { DecisionTimeline } from "./time/DecisionTimeline";
import { WaveLeaderboardTimeState } from "../../../helpers/waves/time.types";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

/**
 * Component for displaying wave time information including dropping,
 * voting phases and decision timeline
 */
export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
  // We still need useDecisionPoints for decision timeline functionality
  // This will eventually be integrated into useWave in the future
  const {
    isMultiDecisionWave,
    isRollingWave,
    isDecisionDetailsOpen,
    setIsDecisionDetailsOpen,
    nextDecisionTime,
    upcomingDecisions,
    nextDecisionTimeLeft,
  } = useDecisionPoints(wave);

  return (
    <div>
      {isMultiDecisionWave ? (
        <>
          <DecisionTimeline
            nextDecisionTime={nextDecisionTime}
            nextDecisionTimeLeft={nextDecisionTimeLeft}
            upcomingDecisions={upcomingDecisions}
            isRollingWave={isRollingWave}
            isDecisionDetailsOpen={isDecisionDetailsOpen}
            setIsDecisionDetailsOpen={setIsDecisionDetailsOpen}
          />

          <div className="tw-flex tw-items-center">
            <CompactDroppingPhaseCard wave={wave} />

            {/* Center dot separator */}
            <div className="tw-mt-1">
              <div className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-white/20"></div>
            </div>

            <CompactVotingPhaseCard wave={wave} />
          </div>
        </>
      ) : (
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <DroppingPhaseCard wave={wave} />

          <VotingPhaseCard wave={wave} />
        </div>
      )}
    </div>
  );
};
