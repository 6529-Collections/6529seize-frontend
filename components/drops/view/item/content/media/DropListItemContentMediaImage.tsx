export default function DropListItemContentMediaImage({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="md:tw-flex md:tw-justify-center tw-w-full">
      <div className="tw-w-full tw-h-full">
        <img
          src={src}
          alt="Drop media"
          className="tw-w-full tw-h-full tw-object-center tw-object-contain"
        />
      </div>
    </div>
  );
}
