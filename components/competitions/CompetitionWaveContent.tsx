"use client";

import { useCompetitionRoute } from "@/contexts/CompetitionRouteContext";
import CompetitionDetail, {
  NativeCompetitionContent,
} from "./CompetitionDetail";
import { CompetitionState } from "./CompetitionState";

export default function CompetitionWaveContent({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId: string;
}) {
  const route = useCompetitionRoute();
  const ready =
    route.waveId === waveId && route.competitionId === competitionId
      ? route.value
      : null;
  let content;
  if (ready === null)
    content = <CompetitionState error={route.error} retry={route.retry} />;
  else if (!route.flat)
    content = (
      <CompetitionDetail waveId={waveId} competitionId={competitionId} />
    );
  else content = <NativeCompetitionContent embedded />;
  return content;
}
