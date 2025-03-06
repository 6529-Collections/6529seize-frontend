import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useWaveTimeState } from "../../../hooks/waves/useWaveTimeState";
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
            <CompactDroppingPhaseCard
              droppingTimeState={droppingTimeState}
              droppingTimeLeft={droppingTimeLeft}
              participationPeriodMin={participationPeriodMin}
              participationPeriodMax={participationPeriodMax}
            />

            {/* Center dot separator */}
            <div className="tw-mt-1">
              <div className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-white/20"></div>
            </div>

            <CompactVotingPhaseCard
              votingTimeState={votingTimeState}
              votingTimeLeft={votingTimeLeft}
              votingPeriodMin={votingPeriodMin}
              votingPeriodMax={votingPeriodMax}
            />
          </div>
        </>
      ) : (
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
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
      )}
    </div>
  );
};
