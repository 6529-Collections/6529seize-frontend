"use client";

function SkeletonBlock({ className }: { readonly className: string }) {
  return <div className={`tw-animate-pulse tw-rounded ${className}`} />;
}

function MemesQuickVoteDropHeaderSkeleton() {
  return (
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
  );
}

function MemesQuickVoteCopySkeleton({
  titleClassName,
}: {
  readonly titleClassName: string;
}) {
  return (
    <div>
      <SkeletonBlock className={titleClassName} />
      <div className="tw-space-y-2">
        <SkeletonBlock className="tw-h-4 tw-w-full tw-bg-iron-800/60" />
        <SkeletonBlock className="tw-h-4 tw-w-11/12 tw-bg-iron-800/60" />
        <SkeletonBlock className="tw-h-4 tw-w-5/6 tw-bg-iron-800/60" />
        <SkeletonBlock className="tw-h-4 tw-w-3/5 tw-bg-iron-800/60" />
      </div>
    </div>
  );
}

function MemesQuickVoteActionBarSkeleton() {
  return (
    <div className="tw-relative tw-bg-[linear-gradient(180deg,rgba(10,10,12,0.68),rgba(10,10,12,0.94))] tw-px-3 tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] tw-pt-1.5 tw-backdrop-blur-[28px] sm:tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] sm:tw-pt-2 md:tw-relative md:tw-z-20 md:tw-shrink-0 md:tw-p-0 md:tw-px-8 md:tw-pb-6 md:tw-pt-0">
      <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-gap-2 sm:tw-gap-3">
        <SkeletonBlock className="tw-mx-auto tw-h-1 tw-w-10 tw-rounded-xl tw-bg-iron-700/40 md:tw-hidden" />

        <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-bg-iron-950/95 tw-p-3 tw-shadow-[0_12px_28px_rgba(0,0,0,0.22)] sm:tw-gap-3 sm:tw-p-4 md:tw-p-5 md:tw-shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-1.5 tw-px-0.5 sm:tw-gap-2 sm:tw-px-1 md:tw-flex-nowrap">
            <SkeletonBlock className="tw-h-3 tw-w-20 tw-bg-iron-800/60" />
            <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-bg-iron-900/70 tw-px-3 tw-py-1 sm:tw-gap-2 sm:tw-py-1.5">
              <SkeletonBlock className="tw-size-3.5 tw-rounded-full tw-bg-iron-700/50" />
              <SkeletonBlock className="tw-h-4 tw-w-32 tw-bg-iron-700/40" />
            </div>
          </div>

          <div className="tw-flex tw-h-11 tw-items-stretch tw-gap-1.5 sm:tw-h-12 sm:tw-gap-2 md:tw-h-12">
            <SkeletonBlock className="tw-h-full tw-min-w-0 tw-flex-1 tw-rounded-xl tw-bg-iron-900 md:tw-rounded-lg" />
            <SkeletonBlock className="tw-h-full tw-w-24 tw-rounded-xl tw-bg-iron-800/80 md:tw-w-20 lg:tw-w-24" />
          </div>
        </div>

        <SkeletonBlock className="tw-h-11 tw-w-full tw-rounded-xl tw-bg-iron-950 sm:tw-h-12" />
      </div>
    </div>
  );
}

export default function MemesQuickVoteDialogSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="quick-vote-loading-skeleton"
      className="tw-flex tw-h-full tw-flex-col md:tw-grid md:tw-min-h-0 md:tw-grid-cols-[minmax(0,1.22fr)_minmax(25rem,1fr)] md:tw-items-stretch"
    >
      <p className="tw-sr-only">
        Loading your queue. Pulling unrated memes and your recent quick-vote
        amounts.
      </p>

      <div data-testid="quick-vote-preview-status" className="tw-hidden">
        <SkeletonBlock className="tw-h-8 tw-w-32 tw-rounded-full tw-bg-iron-800/60" />
      </div>

      <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 tw-px-4 tw-pb-3 tw-pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-backdrop-blur-xl md:tw-hidden">
        <SkeletonBlock className="tw-size-10 tw-rounded-full tw-bg-iron-800/80" />
        <SkeletonBlock className="tw-h-4 tw-w-28 tw-rounded-full tw-bg-iron-800/55" />
        <div className="tw-size-10 tw-shrink-0" />
      </div>

      <div className="tw-relative tw-min-h-0 tw-flex-1 md:tw-contents">
        <div className="tw-min-h-0 tw-flex-1 md:tw-min-h-0 md:tw-border-y-0 md:tw-border-b-0 md:tw-border-l-0 md:tw-border-r md:tw-border-solid md:tw-border-white/10">
          <article className="tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
            <div
              data-testid="quick-vote-preview-mobile-context"
              className="tw-flex tw-h-full tw-flex-col md:tw-flex md:tw-min-h-0 md:tw-flex-1 md:tw-p-0"
            >
              <div className="tw-relative tw-flex tw-h-[45vh] tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 md:tw-flex md:tw-h-full md:tw-w-full md:tw-items-center md:tw-justify-center md:tw-border-0">
                <SkeletonBlock className="tw-h-full tw-w-full tw-bg-iron-800/60" />
              </div>

              <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-bg-[#0a0a0a]/30 tw-px-6 tw-pt-4 md:tw-hidden">
                <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-pb-[calc(env(safe-area-inset-bottom,0px)+10.5rem)] [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-pb-[calc(env(safe-area-inset-bottom,0px)+12rem)] [&::-webkit-scrollbar]:tw-hidden">
                  <div className="tw-flex tw-flex-col tw-gap-5">
                    <MemesQuickVoteDropHeaderSkeleton />
                    <MemesQuickVoteCopySkeleton titleClassName="tw-mb-2 tw-mt-4 tw-h-7 tw-w-3/4 tw-bg-iron-800/80" />
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-20 md:tw-hidden">
          <MemesQuickVoteActionBarSkeleton />
        </div>

        <div
          data-testid="quick-vote-controls-desktop-context"
          className="tw-hidden tw-shrink-0 tw-flex-col tw-gap-0 md:tw-flex md:tw-h-full md:tw-min-h-0 md:tw-overflow-hidden md:tw-bg-[#0a0a0a]/30"
        >
          <div className="tw-hidden tw-shrink-0 tw-flex-wrap tw-gap-2 tw-px-8 md:tw-flex md:tw-pb-6 md:tw-pt-6">
            <SkeletonBlock className="tw-h-8 tw-w-32 tw-rounded-full tw-bg-iron-800/60" />
          </div>

          <div className="tw-relative tw-hidden tw-min-h-0 tw-flex-1 md:tw-flex">
            <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-pb-16 [-ms-overflow-style:none] [scrollbar-width:none] md:tw-px-8 [&::-webkit-scrollbar]:tw-hidden">
              <div className="tw-flex tw-w-full tw-flex-col tw-gap-5">
                <MemesQuickVoteDropHeaderSkeleton />
                <MemesQuickVoteCopySkeleton titleClassName="tw-mb-3 tw-mt-4 tw-h-8 tw-w-4/5 tw-bg-iron-800/80 md:tw-h-9" />
              </div>
            </div>
            <div className="tw-pointer-events-none tw-absolute tw-inset-x-8 tw-bottom-0 tw-h-16 tw-bg-gradient-to-t tw-from-[#0a0a0a] tw-via-[#0a0a0a]/85 tw-to-transparent" />
          </div>

          <MemesQuickVoteActionBarSkeleton />
        </div>
      </div>
    </div>
  );
}
