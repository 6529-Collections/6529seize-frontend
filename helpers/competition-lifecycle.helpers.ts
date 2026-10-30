import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import { ApiCompetitionComputedPhase } from "@/generated/models/ApiCompetitionComputedPhase";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";

export function isCompetitionSubmissionHistory(
  competition: Pick<ApiCompetition, "type" | "lifecycle" | "computed_phase">
): boolean {
  return (
    competition.type === ApiCompetitionType.Rank &&
    (competition.computed_phase === ApiCompetitionComputedPhase.Completed ||
      competition.lifecycle === ApiCompetitionLifecycle.Ended ||
      competition.lifecycle === ApiCompetitionLifecycle.Cancelled ||
      competition.lifecycle === ApiCompetitionLifecycle.Archived)
  );
}
