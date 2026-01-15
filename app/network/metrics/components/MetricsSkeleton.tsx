function SkeletonCard() {
  return (
    <div className="tw-animate-pulse tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5">
      <div className="tw-mb-5 tw-flex tw-items-start tw-justify-between">
        <div className="tw-h-5 tw-w-32 tw-rounded tw-bg-neutral-700" />
        <div className="tw-size-10 tw-rounded-lg tw-bg-neutral-700" />
      </div>
      <div className="tw-flex tw-gap-6">
        <div className="tw-flex-1 tw-space-y-2">
          <div className="tw-h-3 tw-w-12 tw-rounded tw-bg-neutral-700" />
          <div className="tw-h-10 tw-w-20 tw-rounded tw-bg-neutral-700" />
          <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-neutral-700" />
          <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-neutral-700" />
        </div>
        <div className="tw-w-px tw-bg-neutral-700/50" />
        <div className="tw-flex-1 tw-space-y-2">
          <div className="tw-h-3 tw-w-16 tw-rounded tw-bg-neutral-700" />
          <div className="tw-h-8 tw-w-16 tw-rounded tw-bg-neutral-700" />
          <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-neutral-700" />
          <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}

export default function MetricsSkeleton() {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
