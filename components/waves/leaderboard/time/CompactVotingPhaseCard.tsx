import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { CompactPhaseStatus } from "./CompactPhaseStatus";
import { OpenEndedPhaseRow } from "./OpenEndedPhaseRow";

interface CompactVotingPhaseCardProps {
  readonly wave: ApiWave;
}

export function CompactVotingPhaseCard({ wave }: CompactVotingPhaseCardProps) {
  const {
    voting: { isCompleted, isUpcoming, timeLeft },
  } = useWaveTimers(wave);
  const {
    voting: { startTime, endTime },
  } = useWave(wave);

  // Open-ended phases have no end to count down to.
  const hasNoEnd = wave.voting?.period?.max == null;
  if (hasNoEnd && !isUpcoming) {
    return (
      <OpenEndedPhaseRow labelKey="waves.leaderboard.phase.votingOngoing" />
    );
  }

  const countdownLabelKey = isUpcoming
    ? "waves.leaderboard.phase.votingOpensIn"
    : "waves.leaderboard.phase.votingClosesIn";
  const labelKey = isCompleted
    ? "waves.leaderboard.phase.votingClosed"
    : countdownLabelKey;

  return (
    <CompactPhaseStatus
      labelKey={labelKey}
      timestamp={isUpcoming ? startTime : endTime}
      timeLeft={isCompleted ? undefined : timeLeft}
    />
  );
}
