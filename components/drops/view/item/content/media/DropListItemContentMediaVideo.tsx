export default function DropListItemContentMediaVideo({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="tw-mt-4 tw-rounded-lg tw-overflow-hidden">
      <video controls autoPlay className="tw-w-full tw-h-full">
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
