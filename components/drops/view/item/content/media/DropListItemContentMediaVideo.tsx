export default function DropListItemContentMediaVideo({
  src,
}: {
  readonly src: string;
}) {
  return (
    <video controls className="tw-w-full tw-h-40">
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}
