"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useOptionalCompetition } from "@/contexts/CompetitionContext";
import {
  competitionPresentationWave,
  presentationCompetition,
} from "@/helpers/competition-presentation.helpers";
import { isCompetitionAccessError } from "@/helpers/competition.helpers";
import {
  useCompetitionDetail,
  useDefaultCompetition,
} from "./useCompetitionQueries";

/** Shared-chat entry actions use the same explicit competition as its full page. */
export function useCompetitionSubmissionWave(
  wave: ApiWave | null | undefined,
  enabled = true
) {
  const search = useSearchParams();
  const context = useOptionalCompetition();
  const explicit =
    presentationCompetition(wave) ??
    (context && wave?.id === context.competition.wave_id
      ? context.competition
      : null);
  const resolve =
    enabled &&
    Boolean(wave) &&
    !explicit &&
    !wave?.chat.scope.group?.is_direct_message;
  const selectedId = search.get("competition");
  const selection = useDefaultCompetition(
    wave?.id ?? "",
    resolve && !selectedId
  );
  const competitionId = selectedId ?? selection.data?.competition_id ?? "";
  const detail = useCompetitionDetail(
    { waveId: wave?.id ?? "", competitionId },
    resolve && Boolean(competitionId)
  );
  const competition =
    explicit ??
    (!isCompetitionAccessError(detail.error) &&
    detail.data?.wave_id === wave?.id
      ? detail.data
      : null);
  const submissionWave = useMemo(
    () =>
      wave && competition
        ? {
            ...competitionPresentationWave(wave, competition),
            name: wave.name,
          }
        : null,
    [wave, competition]
  );
  return {
    wave: submissionWave,
    pending:
      !explicit &&
      resolve &&
      (selection.isFetching || (Boolean(competitionId) && detail.isPending)),
    retry: () => {
      void selection.refetch();
      void detail.refetch();
    },
  };
}
