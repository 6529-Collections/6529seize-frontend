export default function DropListItemContentMediaAudio({
  src,
}: {
  readonly src: string;
}) {
  return (
    <audio controls>
      <source src={src} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}
