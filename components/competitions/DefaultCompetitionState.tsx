"use client";

import type { useDefaultCompetition } from "@/hooks/competitions/useCompetitionQueries";
import { CompetitionState } from "./CompetitionState";

export function DefaultCompetitionState({
  selection,
}: {
  readonly selection: ReturnType<typeof useDefaultCompetition>;
}) {
  return (
    <CompetitionState
      error={selection.isError}
      empty={selection.isSuccess && selection.data.competition_id === null}
      retry={() => void selection.refetch()}
    />
  );
}
