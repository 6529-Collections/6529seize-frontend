export default function DropListItemContentMediaAudio({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div>
      <audio controls className="tw-w-full tw-max-h-10">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
