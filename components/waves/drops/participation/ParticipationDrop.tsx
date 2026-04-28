import { useWaveParticipationRendererSet } from "./participationRendererRegistry";
import type { ParticipationDropProps } from "./participationRenderer.types";

export default function ParticipationDrop(props: ParticipationDropProps) {
  const { ParticipationDrop: ParticipationDropRenderer } =
    useWaveParticipationRendererSet(props.drop.wave.id);

  return <ParticipationDropRenderer {...props} />;
}
