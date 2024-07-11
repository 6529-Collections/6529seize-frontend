export default function DropListItemContentMediaVideo({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div>
      <video controls autoPlay className="tw-w-full tw-h-full tw-rounded-lg tw-overflow-hidden">
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
