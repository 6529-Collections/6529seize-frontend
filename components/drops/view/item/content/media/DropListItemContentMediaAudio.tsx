import { getMediaPlaybackUrl } from "./mediaPlaybackUrl";

export default function DropListItemContentMediaAudio({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="tw-w-full">
      <audio controls preload="metadata" className="tw-w-full">
        <source src={getMediaPlaybackUrl(src)} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
