"use client";

const QUICK_AMOUNT_KEYS = [
  "quick-vote-amount-1",
  "quick-vote-amount-2",
] as const;

function SkeletonBlock({ className }: { readonly className: string }) {
  return <div className={`tw-animate-pulse tw-rounded ${className}`} />;
}

export default function MemesQuickVoteDialogSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="quick-vote-loading-skeleton"
      className="tw-grid tw-gap-6 md:tw-grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.95fr)] md:tw-items-start"
    >
      <p className="tw-sr-only">
        Loading your queue. Pulling unrated memes and your recent quick-vote
        amounts.
      </p>

      <div className="tw-flex tw-flex-col tw-gap-4">
        <div
          data-testid="quick-vote-preview-status"
          className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 md:tw-hidden"
        >
          <SkeletonBlock className="tw-h-8 tw-w-32 tw-rounded-full tw-bg-primary-500/15" />
          <SkeletonBlock className="tw-h-8 tw-w-20 tw-rounded-full tw-bg-iron-800/80" />
          <SkeletonBlock className="tw-h-8 tw-w-56 tw-rounded-full tw-bg-iron-800/80" />
        </div>

        <div className="tw-relative">
          <article className="tw-relative tw-overflow-hidden tw-rounded-[2rem] tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/95 tw-shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="tw-border-b tw-border-solid tw-border-white/5 tw-p-4 md:tw-hidden">
              <div className="tw-flex tw-items-center tw-gap-3">
                <SkeletonBlock className="tw-size-11 tw-rounded-full tw-bg-iron-800/80" />
                <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <SkeletonBlock className="tw-h-4 tw-w-28 tw-bg-iron-800/80" />
                    <SkeletonBlock className="tw-size-1 tw-rounded-full tw-bg-iron-700" />
                    <SkeletonBlock className="tw-h-3 tw-w-12 tw-bg-iron-800/60" />
                  </div>
                  <SkeletonBlock className="tw-h-3 tw-w-20 tw-bg-iron-800/60" />
                </div>
              </div>
            </div>

            <div
              data-testid="quick-vote-preview-mobile-context"
              className="tw-p-4 sm:tw-p-6 md:tw-p-0"
            >
              <div className="md:tw-hidden">
                <SkeletonBlock className="tw-mb-2 tw-h-8 tw-w-3/4 tw-bg-iron-800/80" />
                <div className="tw-mb-4 tw-space-y-2">
                  <SkeletonBlock className="tw-h-4 tw-w-full tw-bg-iron-800/60" />
                  <SkeletonBlock className="tw-h-4 tw-w-5/6 tw-bg-iron-800/60" />
                  <SkeletonBlock className="tw-h-4 tw-w-2/3 tw-bg-iron-800/60" />
                </div>
              </div>

              <div className="tw-overflow-hidden tw-rounded-[1.5rem] tw-bg-iron-950 md:tw-rounded-none">
                <div className="tw-flex tw-h-[min(52vh,28rem)] tw-items-center tw-justify-center tw-bg-iron-950/80 md:tw-h-[min(72vh,44rem)] md:tw-bg-iron-950/85">
                  <SkeletonBlock className="tw-h-full tw-w-full tw-rounded-[1.5rem] tw-bg-iron-800/60 md:tw-rounded-none" />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="md:tw-sticky md:tw-top-0">
        <div className="tw-flex tw-flex-col tw-gap-4">
          <div
            data-testid="quick-vote-controls-desktop-context"
            className="tw-hidden tw-flex-col tw-gap-4 md:tw-flex"
          >
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <SkeletonBlock className="tw-h-8 tw-w-32 tw-rounded-full tw-bg-primary-500/15" />
              <SkeletonBlock className="tw-h-8 tw-w-20 tw-rounded-full tw-bg-iron-800/80" />
            </div>

            <div className="tw-rounded-[1.75rem] tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-p-5">
              <div className="tw-flex tw-items-center tw-gap-3">
                <SkeletonBlock className="tw-size-11 tw-rounded-full tw-bg-iron-800/80" />
                <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <SkeletonBlock className="tw-h-4 tw-w-28 tw-bg-iron-800/80" />
                    <SkeletonBlock className="tw-size-1 tw-rounded-full tw-bg-iron-700" />
                    <SkeletonBlock className="tw-h-3 tw-w-12 tw-bg-iron-800/60" />
                  </div>
                  <SkeletonBlock className="tw-h-3 tw-w-20 tw-bg-iron-800/60" />
                </div>
              </div>

              <SkeletonBlock className="tw-mt-4 tw-h-8 tw-w-4/5 tw-bg-iron-800/80" />
              <div className="tw-mt-3 tw-space-y-2">
                <SkeletonBlock className="tw-h-4 tw-w-full tw-bg-iron-800/60" />
                <SkeletonBlock className="tw-h-4 tw-w-5/6 tw-bg-iron-800/60" />
                <SkeletonBlock className="tw-h-4 tw-w-2/3 tw-bg-iron-800/60" />
              </div>
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex-1 tw-space-y-2">
              <SkeletonBlock className="tw-h-3 tw-w-20 tw-bg-iron-800/60" />
              <SkeletonBlock className="tw-h-4 tw-w-52 tw-bg-iron-800/60" />
            </div>
            <SkeletonBlock className="tw-h-10 tw-w-28 tw-rounded-full tw-bg-iron-800/80" />
          </div>

          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {QUICK_AMOUNT_KEYS.map((key) => (
              <SkeletonBlock
                key={key}
                className="tw-h-10 tw-w-24 tw-rounded-full tw-bg-iron-800/80"
              />
            ))}
          </div>

          <div className="tw-rounded-3xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-4">
            <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-end">
              <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
                <SkeletonBlock className="tw-h-3 tw-w-24 tw-bg-iron-800/60" />
                <SkeletonBlock className="tw-h-12 tw-w-full tw-rounded-2xl tw-bg-iron-800/80" />
              </div>
              <SkeletonBlock className="tw-h-12 tw-w-32 tw-rounded-2xl tw-bg-primary-500/20" />
            </div>
          </div>

          <SkeletonBlock className="tw-h-12 tw-w-full tw-rounded-2xl tw-bg-iron-800/80" />
        </div>
      </div>
    </div>
  );
}
