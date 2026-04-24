"use client";

import EndedParticipationDrop from "@/components/waves/drops/participation/EndedParticipationDrop";
import OngoingParticipationDrop from "@/components/waves/drops/participation/OngoingParticipationDrop";
import type { ParticipationDropProps } from "@/components/waves/drops/participation/participationRenderer.types";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

export default function QuorumParticipationDrop(props: ParticipationDropProps) {
  const { isVotingEnded } = useDropInteractionRules(props.drop);

  if (isVotingEnded) {
    return (
      <EndedParticipationDrop {...props} contentPresentation="quorumCompact" />
    );
  }

  return (
    <OngoingParticipationDrop {...props} contentPresentation="quorumCompact" />
  );
}
