"use client";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import CompetitionHub from "./CompetitionHub";
import CompetitionWaveRoute from "./CompetitionWaveRoute";
import CompetitionDraftRoute from "./CompetitionDraftRoute";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";

export default function CompetitionRoute({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId?: string;
}) {
  const viewer = useCompetitionViewer();
  if (competitionId !== undefined && competitionId !== "new") {
    return (
      <CompetitionWaveRoute waveId={waveId} competitionId={competitionId} />
    );
  }
  let content = <CompetitionHub waveId={waveId} embedded />;
  if (competitionId === "new")
    content = (
      <CompetitionDraftRoute
        key={`${waveId}:${viewer ?? "anonymous"}`}
        waveId={waveId}
      />
    );
  return <MyStreamWave waveId={waveId} competitionContent={content} />;
}
