import type { ApiWave } from "@/generated/models/ApiWave";
import { SubmissionStatus, useWave } from "@/hooks/useWave";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { CompactPhaseStatus } from "./CompactPhaseStatus";
import { OpenEndedPhaseRow } from "./OpenEndedPhaseRow";

interface CompactDroppingPhaseCardProps {
  readonly wave: ApiWave;
}

export function CompactDroppingPhaseCard({
  wave,
}: CompactDroppingPhaseCardProps) {
  const {
    participation: { isCompleted, isUpcoming, timeLeft },
  } = useWaveTimers(wave);
  const {
    participation: { startTime, endTime, status },
  } = useWave(wave);

  // A manual competition end overrides an absent or future deadline.
  if (status === SubmissionStatus.ENDED) {
    return (
      <CompactPhaseStatus
        labelKey="waves.leaderboard.phase.submissionsClosed"
        timestamp={endTime}
      />
    );
  }

  // Open-ended phases have no end to count down to.
  const hasNoEnd = (wave.participation.period?.max ?? null) === null;
  if (hasNoEnd && !isUpcoming) {
    return (
      <OpenEndedPhaseRow labelKey="waves.leaderboard.phase.droppingOngoing" />
    );
  }

  const countdownLabelKey = isUpcoming
    ? "waves.leaderboard.phase.submissionsOpenIn"
    : "waves.leaderboard.phase.submissionsCloseIn";
  const labelKey = isCompleted
    ? "waves.leaderboard.phase.submissionsClosed"
    : countdownLabelKey;

  return (
    <CompactPhaseStatus
      labelKey={labelKey}
      timestamp={isUpcoming ? startTime : endTime}
      timeLeft={isCompleted ? undefined : timeLeft}
    />
  );
}
