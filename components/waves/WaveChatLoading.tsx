"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

// Reuse the conversation geometry at every entry boundary. Fake post cards
// suggest a different destination and create a second layout during hydration.
export default function WaveChatLoading({
  waveName,
  showHeader = true,
  showComposer = true,
  showTabs = true,
  status,
}: {
  readonly waveName?: string | undefined;
  readonly showHeader?: boolean;
  readonly showComposer?: boolean;
  readonly showTabs?: boolean;
  readonly status?: string;
}) {
  const locale = useBrowserLocale();
  const label = status ?? t(locale, "waves.loadingWaveUnknown");

  return (
    <div
      className="tailwind-scope tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-bg-iron-950"
      data-testid="wave-chat-loading"
    >
      {showHeader && (
        <div className="tw-flex tw-min-h-16 tw-shrink-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 md:tw-min-h-[68px]">
          <div
            aria-hidden="true"
            className="tw-size-9 tw-shrink-0 tw-rounded-full tw-bg-iron-900"
          />
          {waveName ? (
            <h1 className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100 lg:tw-text-xl">
              {waveName}
            </h1>
          ) : (
            <div
              aria-hidden="true"
              className="tw-h-3 tw-w-36 tw-max-w-full tw-rounded-md tw-bg-iron-900"
            />
          )}
        </div>
      )}
      {showTabs && (
        <div
          aria-hidden="true"
          className="tw-flex tw-h-12 tw-shrink-0 tw-items-center tw-gap-6 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4"
        >
          <div className="tw-h-2 tw-w-10 tw-rounded-md tw-bg-iron-900" />
          <div className="tw-h-2 tw-w-20 tw-rounded-md tw-bg-iron-900" />
          <div className="tw-h-2 tw-w-12 tw-rounded-md tw-bg-iron-900" />
        </div>
      )}
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-p-6">
        <output aria-label={label} className="tw-text-sm tw-text-iron-400">
          {label}
        </output>
      </div>
      {showComposer && (
        <div
          aria-hidden="true"
          className="tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4"
        >
          <div className="tw-size-7 tw-shrink-0 tw-rounded-full tw-bg-iron-900" />
          <div className="tw-h-10 tw-min-w-0 tw-flex-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800" />
        </div>
      )}
    </div>
  );
}
