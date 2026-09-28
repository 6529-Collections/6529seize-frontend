"use client";
import { useCompetitionEvents } from "@/hooks/competitions/useCompetitionEvents";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import CompetitionHub from "./CompetitionHub";
import CompetitionDetail from "./CompetitionDetail";
import CompetitionDraftRoute from "./CompetitionDraftRoute";

export default function CompetitionRoute({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId?: string;
}) {
  useCompetitionEvents(waveId);
  let content = <CompetitionHub waveId={waveId} />;
  if (competitionId === "new")
    content = <CompetitionDraftRoute waveId={waveId} />;
  else if (competitionId !== undefined)
    content = (
      <CompetitionDetail
        key={`${waveId}:${competitionId}`}
        waveId={waveId}
        competitionId={competitionId}
      />
    );
  return <WavesLayout>{content}</WavesLayout>;
}
