"use client";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useCompetitionDrop } from "@/hooks/competitions/useCompetitionDrop";
import { useWaveParticipationRendererSet } from "./participationRendererRegistry";
import type { ParticipationDropProps } from "./participationRenderer.types";

function ParticipationDropContent(props: ParticipationDropProps) {
  const { ParticipationDrop: ParticipationDropRenderer } =
    useWaveParticipationRendererSet(props.drop.wave.id);

  return <ParticipationDropRenderer {...props} />;
}

function CompetitionParticipationDrop(props: ParticipationDropProps) {
  const drop = useCompetitionDrop(props.drop);
  return <ParticipationDropContent {...props} drop={drop} />;
}

export default function ParticipationDrop(props: ParticipationDropProps) {
  return isMultiCompetitionEnabled() ? (
    <CompetitionParticipationDrop {...props} />
  ) : (
    <ParticipationDropContent {...props} />
  );
}
