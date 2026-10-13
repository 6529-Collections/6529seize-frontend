"use client";

import { useSearchParams } from "next/navigation";
import { useCompetitionRoute } from "@/contexts/CompetitionRouteContext";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import CompetitionDetail, {
  NativeCompetitionContent,
} from "./CompetitionDetail";
import { getCompetitionTab } from "@/helpers/competition.helpers";
import { CompetitionState } from "./CompetitionState";

export default function CompetitionWaveRoute({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId: string;
}) {
  const search = useSearchParams();
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
  else {
    const legacy = ready.hub.legacy_primary_competition_id === competitionId;
    const tab = getCompetitionTab(search.get("tab"));
    if (!legacy || tab === "rules" || tab === "votes")
      content = <NativeCompetitionContent embedded />;
  }
  return (
    <MyStreamWave
      key={`${waveId}:${competitionId}:${route.viewer ?? "anonymous"}`}
      waveId={waveId}
      competitionContent={content}
    />
  );
}
