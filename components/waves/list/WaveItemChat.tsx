"use client";

import { useWavePreviewById } from "@/hooks/useWavePreviewById";
import ChatItemHrefButtons from "../ChatItemHrefButtons";
import WaveItemWide from "./WaveItemWide";

export default function WaveItemChat({
  href,
  waveId,
}: {
  readonly href: string;
  readonly waveId: string;
}) {
  const { wave } = useWavePreviewById(waveId);

  return (
    <div className="tailwind-scope tw-flex tw-w-full tw-max-w-2xl tw-items-stretch tw-gap-x-1">
      <div className="tw-min-w-0 tw-flex-1">
        <WaveItemWide
          wave={wave}
          userPlaceholder={href}
          titlePlaceholder={waveId}
        />
      </div>
      <ChatItemHrefButtons href={href} relativeHref={`/waves/${waveId}`} />
    </div>
  );
}
