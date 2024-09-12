export default function DropListItemContentMediaImage({
  src,
  onImageLoaded,
}: {
  readonly src: string;
  readonly onImageLoaded: () => void;
}) {
  return (
    <div className="tw-w-full tw-h-full tw-max-w-lg">
      <img
        src={src}
        alt="Drop media"
        className="tw-w-full tw-h-full tw-object-center tw-object-contain"
        onLoad={onImageLoaded}
      />
    </div>
  );
}
