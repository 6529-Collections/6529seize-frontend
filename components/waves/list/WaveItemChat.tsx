import { useWaveById } from "../../../hooks/useWaveById";
import ChatItemHrefButtons from "../ChatItemHrefButtons";
import WaveItem from "./WaveItem";

export default function WaveItemChat({
  href,
  waveId,
}: {
  readonly href: string;
  readonly waveId: string;
}) {
  const wave = useWaveById(waveId);

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1">
        <WaveItem
          wave={wave?.wave}
          userPlaceholder={href}
          titlePlaceholder={waveId}
        />
      </div>
      <ChatItemHrefButtons href={href} relativeHref={`/waves/${waveId}`} />
    </div>
  );
}
