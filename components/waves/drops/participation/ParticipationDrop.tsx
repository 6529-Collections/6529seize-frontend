"use client";
import { useCompetitionDrop } from "@/hooks/competitions/useCompetitionDrop";
import { useWaveParticipationRendererSet } from "./participationRendererRegistry";
import type { ParticipationDropProps } from "./participationRenderer.types";

function ParticipationDropContent(props: ParticipationDropProps) {
  const { ParticipationDrop: ParticipationDropRenderer } =
    useWaveParticipationRendererSet(
      props.drop.wave.id,
      props.drop.competition_context?.data.competition?.capabilities
    );

  return <ParticipationDropRenderer {...props} />;
}

function CompetitionParticipationDrop(props: ParticipationDropProps) {
  const drop = useCompetitionDrop(props.drop);
  return <ParticipationDropContent {...props} drop={drop} />;
}

export default function ParticipationDrop(props: ParticipationDropProps) {
  return <CompetitionParticipationDrop {...props} />;
}
