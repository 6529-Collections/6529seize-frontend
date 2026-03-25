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
      className="tw-flex tw-h-full tw-flex-col sm:tw-grid sm:tw-grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.95fr)] sm:tw-gap-0"
    >
      <p className="tw-sr-only">
        Loading your queue. Pulling unrated memes and your recent quick-vote
        amounts.
      </p>

      <div data-testid="quick-vote-preview-status" className="tw-hidden">
        <SkeletonBlock className="tw-h-8 tw-w-32 tw-rounded-full tw-bg-iron-800/80" />
      </div>

      <div className="tw-flex tw-min-h-[5rem] tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 tw-px-4 tw-pb-3 tw-pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] tw-backdrop-blur-xl sm:tw-hidden">
        <SkeletonBlock className="tw-size-10 tw-rounded-full tw-bg-iron-800/80" />
        <SkeletonBlock className="tw-h-4 tw-w-28 tw-rounded-full tw-bg-iron-800/70" />
        <div className="tw-size-10 tw-shrink-0" />
      </div>

      <div className="tw-relative tw-min-h-0 tw-flex-1 sm:tw-contents">
        <article className="tw-relative tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-overflow-hidden sm:tw-block sm:tw-min-h-0 sm:tw-flex-none">
          <div
            data-testid="quick-vote-preview-mobile-context"
            className="tw-flex tw-h-full tw-flex-col sm:tw-p-0"
          >
            <div className="tw-flex tw-h-[45vh] tw-shrink-0 tw-items-center tw-justify-center tw-border-b tw-border-solid tw-border-white/5 sm:tw-h-[min(72vh,44rem)] sm:tw-border-0">
              <SkeletonBlock className="tw-h-full tw-w-full tw-bg-iron-800/60" />
            </div>

            <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-[#0a0a0a]/30 tw-px-6 tw-pt-4 sm:tw-hidden">
              <div className="tw-flex tw-flex-col tw-gap-4 tw-pb-[calc(env(safe-area-inset-bottom,0px)+12rem)]">
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

                <div>
                  <SkeletonBlock className="tw-mb-3 tw-mt-4 tw-h-8 tw-w-3/4 tw-bg-iron-800/80" />
                  <div className="tw-space-y-2">
                    <SkeletonBlock className="tw-h-4 tw-w-full tw-bg-iron-800/60" />
                    <SkeletonBlock className="tw-h-4 tw-w-5/6 tw-bg-iron-800/60" />
                    <SkeletonBlock className="tw-h-4 tw-w-2/3 tw-bg-iron-800/60" />
                  </div>
                </div>
              </div>

              <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-24 tw-bg-gradient-to-t tw-from-[#0a0a0a] tw-via-[#0a0a0a]/90 tw-to-transparent sm:tw-hidden" />
            </div>
          </div>
        </article>

        <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-20 sm:tw-hidden">
          <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-solid tw-border-white/5 tw-bg-[#0a0a0a]/95 tw-p-4 tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] tw-pt-3 tw-shadow-[0_-20px_40px_rgba(0,0,0,0.8)] tw-backdrop-blur-2xl">
            <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-rounded-xl sm:tw-border sm:tw-border-solid sm:tw-border-white/10 sm:tw-bg-white/[0.03] sm:tw-p-5 sm:tw-shadow-[0_20px_40px_rgba(0,0,0,0.18)] sm:tw-backdrop-blur-xl">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-1">
                <SkeletonBlock className="tw-h-3 tw-w-20 tw-bg-iron-800/60" />
                <div className="tw-flex tw-items-center tw-gap-2">
                  <SkeletonBlock className="tw-size-3.5 tw-rounded-full tw-bg-primary-500/20" />
                  <SkeletonBlock className="tw-h-4 tw-w-32 tw-bg-primary-500/15" />
                </div>
              </div>

              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {QUICK_AMOUNT_KEYS.map((key) => (
                  <SkeletonBlock
                    key={key}
                    className="tw-h-10 tw-w-24 tw-rounded-full tw-bg-iron-800/80"
                  />
                ))}
              </div>

              <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-4">
                <div className="tw-flex tw-flex-col tw-gap-3">
                  <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
                    <SkeletonBlock className="tw-h-3 tw-w-24 tw-bg-iron-800/60" />
                    <SkeletonBlock className="tw-h-12 tw-w-full tw-rounded-xl tw-bg-iron-800/80" />
                  </div>
                  <SkeletonBlock className="tw-h-12 tw-w-32 tw-rounded-xl tw-bg-primary-500/20" />
                </div>
              </div>
            </div>

            <SkeletonBlock className="tw-h-12 tw-w-full tw-rounded-xl tw-bg-iron-800/80" />
          </div>
        </div>

        <div
          data-testid="quick-vote-controls-desktop-context"
          className="tw-hidden tw-flex-col tw-gap-4 sm:tw-flex sm:tw-h-full sm:tw-min-h-0 sm:tw-gap-0"
        >
          <div className="tw-hidden tw-flex-wrap tw-gap-2 sm:tw-flex sm:tw-justify-end sm:tw-pb-3 sm:tw-pl-8 sm:tw-pr-24 sm:tw-pt-6">
            <SkeletonBlock className="tw-h-8 tw-w-32 tw-rounded-full tw-bg-iron-800/80" />
          </div>

          <div className="tw-hidden sm:tw-flex sm:tw-min-h-0 sm:tw-flex-1 sm:tw-overflow-y-auto sm:tw-px-8 sm:tw-pb-6">
            <div className="tw-flex tw-min-h-full tw-w-full tw-flex-col">
              <div className="tw-flex tw-flex-col tw-gap-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-5 tw-shadow-[0_24px_60px_rgba(0,0,0,0.2)] tw-backdrop-blur-xl sm:tw-p-6">
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
                <div className="tw-space-y-2">
                  <SkeletonBlock className="tw-h-4 tw-w-full tw-bg-iron-800/60" />
                  <SkeletonBlock className="tw-h-4 tw-w-5/6 tw-bg-iron-800/60" />
                  <SkeletonBlock className="tw-h-4 tw-w-2/3 tw-bg-iron-800/60" />
                </div>
              </div>
            </div>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-shrink-0 sm:tw-px-8 sm:tw-pb-6">
            <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-4 tw-shadow-[0_20px_40px_rgba(0,0,0,0.18)] tw-backdrop-blur-xl sm:tw-p-5">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                <SkeletonBlock className="tw-h-3 tw-w-20 tw-bg-iron-800/60" />
                <div className="tw-flex tw-items-center tw-gap-2">
                  <SkeletonBlock className="tw-size-3.5 tw-rounded-full tw-bg-primary-500/20" />
                  <SkeletonBlock className="tw-h-4 tw-w-32 tw-bg-primary-500/15" />
                </div>
              </div>

              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {QUICK_AMOUNT_KEYS.map((key) => (
                  <SkeletonBlock
                    key={key}
                    className="tw-h-10 tw-w-24 tw-rounded-full tw-bg-iron-800/80"
                  />
                ))}
              </div>

              <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-4">
                <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-end">
                  <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
                    <SkeletonBlock className="tw-h-3 tw-w-24 tw-bg-iron-800/60" />
                    <SkeletonBlock className="tw-h-12 tw-w-full tw-rounded-xl tw-bg-iron-800/80" />
                  </div>
                  <SkeletonBlock className="tw-h-12 tw-w-32 tw-rounded-xl tw-bg-primary-500/20" />
                </div>
              </div>
            </div>

            <SkeletonBlock className="tw-h-11 tw-w-full tw-rounded-xl tw-bg-iron-800/80 sm:tw-h-[44px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
