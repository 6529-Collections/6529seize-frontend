export default function CommunityMembersTableSkeleton({
  rows = 10,
}: {
  readonly rows?: number;
}) {
  return (
    <div className="tw-bg-iron-950 tw-rounded-lg sm:tw-border sm:tw-border-solid sm:tw-border-iron-700 tw-overflow-hidden">
      <div className="tw-animate-pulse">
        <div className="tw-h-12 tw-bg-iron-900 tw-border-b tw-border-iron-700" />
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="tw-h-16 tw-border-b tw-border-iron-800 tw-flex tw-items-center tw-gap-4 tw-px-6"
          >
            <div className="tw-w-8 tw-h-4 tw-bg-iron-800 tw-rounded" />
            <div className="tw-w-8 tw-h-8 tw-bg-iron-800 tw-rounded-md" />
            <div className="tw-w-6 tw-h-6 tw-bg-iron-800 tw-rounded-full" />
            <div className="tw-w-32 tw-h-4 tw-bg-iron-800 tw-rounded" />
            <div className="tw-flex-1" />
            <div className="tw-w-20 tw-h-4 tw-bg-iron-800 tw-rounded" />
            <div className="tw-w-20 tw-h-4 tw-bg-iron-800 tw-rounded" />
            <div className="tw-w-24 tw-h-4 tw-bg-iron-800 tw-rounded" />
            <div className="tw-w-16 tw-h-4 tw-bg-iron-800 tw-rounded" />
            <div className="tw-w-16 tw-h-4 tw-bg-iron-800 tw-rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
