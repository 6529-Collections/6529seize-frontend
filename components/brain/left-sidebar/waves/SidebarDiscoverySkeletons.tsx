"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function SidebarRecommendationsSkeleton({
  isTouchPreview,
}: {
  readonly isTouchPreview: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <div>
      <output className="tw-sr-only">
        {t(locale, "waves.discovery.loadingRecommendations")}
      </output>
      <div
        aria-hidden="true"
        className="tw-animate-pulse motion-reduce:tw-animate-none"
      >
        <div className="tw-mb-2 tw-h-4 tw-w-3/4 tw-rounded-md tw-bg-iron-800/60" />
        <div
          className={`tw-flex tw-overflow-hidden tw-py-1 ${isTouchPreview ? "tw-gap-4" : "tw-gap-3"}`}
        >
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`tw-shrink-0 tw-rounded-full tw-bg-iron-800/60 ${isTouchPreview ? "tw-size-11" : "tw-size-8"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SidebarVotesSkeleton() {
  const locale = useBrowserLocale();
  return (
    <div>
      <output className="tw-sr-only">
        {t(locale, "waves.discovery.loadingVotes")}
      </output>
      <div
        aria-hidden="true"
        className="tw-animate-pulse motion-reduce:tw-animate-none"
      >
        <div className="tw-mb-2 tw-h-4 tw-w-3/4 tw-rounded-md tw-bg-iron-800/60" />
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="tw-flex tw-h-12 tw-items-center tw-gap-2 tw-px-2 tw-py-1"
          >
            <div className="tw-size-8 tw-shrink-0 tw-rounded-full tw-bg-iron-800/60" />
            <div className="tw-flex-1 tw-space-y-2">
              <div className="tw-h-3 tw-w-3/4 tw-rounded-md tw-bg-iron-800/60" />
              <div className="tw-h-2 tw-w-1/2 tw-rounded-md tw-bg-iron-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarAnnouncementSkeleton() {
  const locale = useBrowserLocale();
  return (
    <div className="tw-px-4">
      <output className="tw-sr-only">
        {t(locale, "waves.discovery.loadingAnnouncements")}
      </output>
      <div
        aria-hidden="true"
        className="tw-flex tw-h-12 tw-animate-pulse tw-items-center tw-gap-3 motion-reduce:tw-animate-none"
      >
        <div className="tw-size-8 tw-shrink-0 tw-rounded-full tw-bg-iron-800/60" />
        <div className="tw-h-3 tw-w-28 tw-rounded-md tw-bg-iron-800/60" />
      </div>
    </div>
  );
}
