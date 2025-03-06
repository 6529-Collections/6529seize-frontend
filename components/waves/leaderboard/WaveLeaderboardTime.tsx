import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveTimeState } from "../../../hooks/waves/useWaveTimeState";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { DroppingPhaseCard } from "./time/DroppingPhaseCard";
import { VotingPhaseCard } from "./time/VotingPhaseCard";
import { DecisionTimeline } from "./time/DecisionTimeline";

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
  // Use custom hooks for state management
  const {
    droppingTimeState,
    droppingTimeLeft,
    participationPeriodMin,
    participationPeriodMax,
    votingTimeState,
    votingTimeLeft,
    votingPeriodMin,
    votingPeriodMax,
  } = useWaveTimeState(wave);

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
    <div className="tw-@container">
      {/* Dropping and Voting Phase Cards */}
      <div className="tw-grid [@container_(max-width:700px)]:tw-grid-cols-1 tw-grid-cols-2 tw-gap-3 tw-@container">
        <DroppingPhaseCard
          droppingTimeState={droppingTimeState}
          droppingTimeLeft={droppingTimeLeft}
          participationPeriodMin={participationPeriodMin}
          participationPeriodMax={participationPeriodMax}
        />
        
        <VotingPhaseCard
          votingTimeState={votingTimeState}
          votingTimeLeft={votingTimeLeft}
          votingPeriodMin={votingPeriodMin}
          votingPeriodMax={votingPeriodMax}
        />
      </div>

      {/* Decision Timeline for multi-decision waves */}
      {isMultiDecisionWave && (
        <DecisionTimeline
          nextDecisionTime={nextDecisionTime}
          nextDecisionTimeLeft={nextDecisionTimeLeft}
          upcomingDecisions={upcomingDecisions}
          isRollingWave={isRollingWave}
          isDecisionDetailsOpen={isDecisionDetailsOpen}
          setIsDecisionDetailsOpen={setIsDecisionDetailsOpen}
        />
      )}
    </div>
  );
};
