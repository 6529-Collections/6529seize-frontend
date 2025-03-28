import { removeBaseEndpoint } from "../../../helpers/Helpers";
import { useWaveById } from "../../../hooks/useWaveById";
import WaveItem from "./WaveItem";
import Link from "next/link";

export default function WaveItemChat({
  href,
  waveId,
}: {
  readonly href: string;
  readonly waveId: string;
}) {
  const wave = useWaveById(waveId);
  const relativeLink = removeBaseEndpoint(href);

  return (
    <Link className="tw-no-underline" href={relativeLink}>
      <WaveItem
        wave={wave?.wave}
        userPlaceholder={href}
        titlePlaceholder={waveId}
      />
    </Link>
  );
}
