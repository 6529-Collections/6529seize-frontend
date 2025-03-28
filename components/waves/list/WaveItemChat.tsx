import { useWaveById } from "../../../hooks/useWaveById";
import WaveItem from "./WaveItem";

export default function WaveItemChat({
  href,
  waveId,
}: {
  readonly href: string;
  readonly waveId: string;
}) {
  const wave = useWaveById(waveId);

  if (!wave.wave) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {href}
      </a>
    );
  }

  return <WaveItem wave={wave.wave} />;
}
