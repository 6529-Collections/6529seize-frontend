"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import PostingAccessLoadingPlaceholder from "./PostingAccessLoadingPlaceholder";

const messageWidths = [68, 46, 78, 58] as const;

const skeletonClassName =
  "tw-animate-[shimmer_1.8s_ease-in-out_infinite] tw-bg-[linear-gradient(90deg,#1C1C21_20%,#303137_50%,#1C1C21_80%)] tw-bg-[length:200%_100%] motion-reduce:tw-animate-none";

function SkeletonBlock({ className }: { readonly className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${skeletonClassName} tw-block tw-rounded-md ${className}`}
    />
  );
}

export default function WaveViewLoadingPlaceholder() {
  const locale = useBrowserLocale();
  const loadingLabel = t(locale, "waves.loadingStatus");

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={loadingLabel}
      data-testid="wave-view-loading-placeholder"
      className="tw-flex tw-h-full tw-min-h-0 tw-w-full tw-flex-col tw-overflow-hidden tw-bg-iron-950"
    >
      <span className="tw-sr-only">{loadingLabel}</span>
      <header className="tw-flex tw-flex-none tw-items-center tw-gap-3 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 md:tw-px-6">
        <SkeletonBlock className="tw-size-10 tw-shrink-0 tw-rounded-full" />
        <div className="tw-min-w-0 tw-flex-1">
          <SkeletonBlock className="tw-h-4 tw-w-40 tw-max-w-[45%]" />
          <SkeletonBlock className="tw-mt-2 tw-h-3 tw-w-56 tw-max-w-[65%]" />
        </div>
        <SkeletonBlock className="tw-size-9 tw-shrink-0 tw-rounded-lg" />
        <SkeletonBlock className="tw-size-9 tw-shrink-0 tw-rounded-lg" />
      </header>

      <div className="tw-min-h-0 tw-flex-1 tw-overflow-hidden tw-px-4 tw-py-5 md:tw-px-6">
        <div className="tw-flex tw-flex-col tw-gap-7">
          {messageWidths.map((width, index) => (
            <div
              key={width}
              className="tw-flex tw-min-w-0 tw-items-start tw-gap-3"
            >
              <SkeletonBlock className="tw-size-9 tw-shrink-0 tw-rounded-full" />
              <div className="tw-min-w-0 tw-flex-1">
                <SkeletonBlock className="tw-h-3.5 tw-w-24" />
                <div
                  aria-hidden="true"
                  className={`${skeletonClassName} tw-mt-3 tw-h-3 tw-rounded-md`}
                  style={{ width: `${width}%` }}
                />
                {index % 2 === 0 && (
                  <div
                    aria-hidden="true"
                    className={`${skeletonClassName} tw-mt-2 tw-h-3 tw-rounded-md`}
                    style={{ width: `${Math.max(34, width - 22)}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="tw-flex-none tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-2">
        <PostingAccessLoadingPlaceholder />
      </footer>
    </section>
  );
}
