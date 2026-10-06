"use client";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import CompetitionHub from "./CompetitionHub";
import CompetitionWaveRoute from "./CompetitionWaveRoute";
import CompetitionDraftRoute from "./CompetitionDraftRoute";

export default function CompetitionRoute({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId?: string;
}) {
  if (competitionId !== undefined && competitionId !== "new") {
    return (
      <CompetitionWaveRoute waveId={waveId} competitionId={competitionId} />
    );
  }
  let content = <CompetitionHub waveId={waveId} embedded />;
  if (competitionId === "new")
    content = <CompetitionDraftRoute waveId={waveId} />;
  return (
    <WavesLayout>
      <MyStreamWave waveId={waveId} competitionContent={content} />
    </WavesLayout>
  );
}
