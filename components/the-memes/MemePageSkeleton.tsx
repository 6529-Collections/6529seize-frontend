function MemePageSkeletonBlock({ className }: { readonly className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`tw-animate-pulse tw-rounded tw-bg-iron-800/50 ${className}`}
    />
  );
}

const DETAILS_SKELETON_ITEMS = [
  "mint-price",
  "metadata",
  "floor-price",
  "market-cap",
  "highest-offer",
  "marketplaces",
] as const;
const TAB_SKELETON_ITEMS = [
  "live",
  "your-cards",
  "collectors",
  "history",
] as const;

export function MemePageTitleSkeleton() {
  return (
    <div className="tw-mb-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1 md:tw-flex-nowrap md:tw-gap-x-0">
      <MemePageSkeletonBlock className="tw-h-7 tw-w-20 sm:tw-h-8 sm:tw-w-24" />
      <span
        aria-hidden="true"
        className="tw-mx-3 tw-h-5 tw-w-px tw-self-center tw-bg-white/[0.16] sm:tw-h-6"
      />
      <MemePageSkeletonBlock className="tw-h-7 tw-w-48 tw-max-w-[60vw] sm:tw-h-8 sm:tw-w-72 md:tw-max-w-sm" />
    </div>
  );
}

export function MemePageNavigationSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-px-2 tw-py-1.5"
    >
      <MemePageSkeletonBlock className="tw-size-8 tw-rounded-md" />
      <MemePageSkeletonBlock className="tw-h-5 tw-w-16" />
      <MemePageSkeletonBlock className="tw-size-8 tw-rounded-md" />
    </div>
  );
}

export function MemePageSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="tw-mb-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:tw-gap-x-10 xl:tw-gap-x-16">
        <div>
          <div className="tw-relative tw-w-full tw-overflow-hidden">
            <div className="tw-relative tw-h-96 tw-w-full tw-animate-pulse tw-bg-iron-800/50 sm:tw-h-[520px] lg:tw-h-[650px]" />
          </div>
        </div>
        <div className="tw-pt-6 md:tw-pt-8">
          <div className="tw-flex tw-flex-col tw-gap-8">
            <div>
              <MemePageSkeletonBlock className="tw-mb-2 tw-h-4 tw-w-24" />
              <div className="tw-flex tw-items-center tw-gap-2.5">
                <MemePageSkeletonBlock className="tw-size-8 tw-rounded-full" />
                <MemePageSkeletonBlock className="tw-h-5 tw-w-32" />
              </div>
            </div>
            <div>
              <MemePageSkeletonBlock className="tw-mb-2 tw-h-4 tw-w-20" />
              <MemePageSkeletonBlock className="tw-h-5 tw-w-44" />
            </div>
            <div>
              <MemePageSkeletonBlock className="tw-mb-4 tw-h-4 tw-w-28" />
              <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-5 sm:tw-grid-cols-2">
                {DETAILS_SKELETON_ITEMS.map((item) => (
                  <div key={item}>
                    <MemePageSkeletonBlock className="tw-mb-1.5 tw-h-4 tw-w-20" />
                    <MemePageSkeletonBlock className="tw-h-6 tw-w-24" />
                  </div>
                ))}
              </div>
              <MemePageSkeletonBlock className="tw-mt-6 tw-h-10 tw-w-44 tw-rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <div className="tw-mb-6 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700">
        <div className="-tw-mb-px tw-flex tw-gap-x-4">
          {TAB_SKELETON_ITEMS.map((item) => (
            <MemePageSkeletonBlock
              key={item}
              className="tw-my-4 tw-h-4 tw-w-20"
            />
          ))}
        </div>
      </div>
      <div className="tw-space-y-3 tw-pb-3">
        <MemePageSkeletonBlock className="tw-h-4 tw-w-full tw-max-w-3xl" />
        <MemePageSkeletonBlock className="tw-h-4 tw-w-11/12 tw-max-w-2xl" />
        <MemePageSkeletonBlock className="tw-h-4 tw-w-3/4 tw-max-w-xl" />
      </div>
    </div>
  );
}
