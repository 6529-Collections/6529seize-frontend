import { useWaveById } from "@/hooks/useWaveById";
import ChatItemHrefButtons from "../ChatItemHrefButtons";
import WaveItemWide from "./WaveItemWide";

export default function WaveItemChat({
  href,
  waveId,
}: {
  readonly href: string;
  readonly waveId: string;
}) {
  const wave = useWaveById(waveId);

  return (
    <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700">
          <WaveItemWide
            wave={wave.wave}
            userPlaceholder={href}
            titlePlaceholder={waveId}
          />
        </div>
      </div>
      <ChatItemHrefButtons href={href} relativeHref={`/waves/${waveId}`} />
    </div>
  );
}
