import { useWaveById } from "../../../hooks/useWaveById";
import { LinkText } from "../../drops/view/part/DropPartMarkdownLinkHandlers";
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
    <>
      <LinkText href={href} relativeHref={`/waves/${waveId}`} />
      <div className="tw-flex-1 tw-min-w-0">
        <WaveItem
          wave={wave?.wave}
          userPlaceholder={href}
          titlePlaceholder={waveId}
        />
      </div>
    </>
  );
}
