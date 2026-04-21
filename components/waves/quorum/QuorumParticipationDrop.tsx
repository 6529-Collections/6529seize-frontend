import DefaultParticipationDrop from "@/components/waves/drops/participation/DefaultParticipationDrop";
import type { ParticipationDropProps } from "@/components/waves/drops/participation/participationRenderer.types";

export default function QuorumParticipationDrop(props: ParticipationDropProps) {
  // Keep quorum on the default layout until the proposal-specific design lands.
  return <DefaultParticipationDrop {...props} />;
}
