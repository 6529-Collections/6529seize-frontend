const SKELETON_INDICES = [0, 1, 2];

export function XtdhTokensSkeleton() {
  return (
    <>
      <output className="tw-sr-only" aria-live="polite">
        Loading tokens...
      </output>
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0" aria-busy="true">
        {SKELETON_INDICES.map((index) => (
          <li
            key={`token-skeleton-${index}`}
            className="tw-list-none tw-animate-pulse tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4"
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-h-12 tw-w-12 tw-rounded-lg tw-bg-iron-800" />
              <div className="tw-flex-1 tw-space-y-2">
                <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-850" />
              </div>
            </div>
            <div className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2">
              <div className="tw-space-y-2">
                <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-850" />
              </div>
              <div className="tw-space-y-2">
                <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
                <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-850" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
