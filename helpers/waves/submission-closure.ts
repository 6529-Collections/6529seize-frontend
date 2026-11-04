import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { ApiCompetitionComputedPhase } from "@/generated/models/ApiCompetitionComputedPhase";
import { presentationCompetition } from "@/helpers/competition-presentation.helpers";

/** A known closure does not imply anything about the viewer's group eligibility. */
export function getWaveSubmissionClosure(wave: ApiWave, now: number) {
  const competition = presentationCompetition(wave);
  const end = competition
    ? competition.participation.ends_at
    : wave.participation.period?.max;
  const elapsedDates = [end, competition?.ended_at].filter(
    (date): date is number =>
      typeof date === "number" && Number.isFinite(date) && date < now
  );
  const hasEnded =
    elapsedDates.length > 0 ||
    competition?.lifecycle === ApiCompetitionLifecycle.Ended ||
    competition?.computed_phase === ApiCompetitionComputedPhase.Completed;

  return hasEnded
    ? { closedAt: elapsedDates.length ? Math.min(...elapsedDates) : null }
    : null;
}
