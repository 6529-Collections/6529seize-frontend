const CARD_IDS = Array.from({ length: 12 }, (_, index) => index);

export default function CollectionGridSkeleton({
  className,
}: {
  readonly className: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="collection-grid-skeleton"
      className={`${className} tw-animate-pulse motion-reduce:tw-animate-none`}
    >
      {CARD_IDS.map((id) => (
        <div
          key={id}
          className="tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950"
        >
          <div className="tw-h-[300px] tw-bg-iron-900" />
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-px-2 tw-py-4 md:tw-px-4">
            <div className="tw-h-5 tw-w-3/4 tw-rounded-md tw-bg-iron-900" />
            <div className="tw-h-4 tw-w-1/2 tw-rounded-md tw-bg-iron-900" />
            <div className="tw-h-4 tw-w-2/3 tw-rounded-md tw-bg-iron-900" />
          </div>
        </div>
      ))}
    </div>
  );
}
