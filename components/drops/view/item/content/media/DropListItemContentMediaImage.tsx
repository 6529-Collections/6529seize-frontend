export default function DropListItemContentMediaImage({
  src,
}: {
  readonly src: string;
}) {
  return (
    <div className="tw-mt-1 md:tw-flex md:tw-justify-center tw-w-full md:tw-p-[1px] tw-ring-1 tw-ring-inset tw-ring-iron-700 md:tw-rounded-xl">
      <div className="tw-w-full md:tw-max-h-96">
        <img
          src={src}
          alt="Drop media"
          className="tw-w-full tw-h-full tw-object-center tw-object-contain"
        />
      </div>
    </div>
  );
}
