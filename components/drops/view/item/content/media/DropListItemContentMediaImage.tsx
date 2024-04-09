export default function DropListItemContentMediaImage({
  src,
}: {
  readonly src: string;
}) {
  return (
    <img
      src={src}
      className="tw-w-full tw-h-full tw-object-center tw-object-contain"
    />
  );
}
