"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function VideoPlaybackErrorOverlay({
  onRetry,
}: {
  readonly onRetry: () => void;
}) {
  const locale = useBrowserLocale();

  return (
    <div
      role="alert"
      className="tw-absolute tw-inset-0 tw-z-20 tw-flex tw-min-h-32 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-bg-black/90 tw-p-4 tw-text-center"
    >
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
        {t(locale, "drop.media.videoLoadFailed")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/20 tw-bg-white/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/20"
      >
        {t(locale, "drop.media.retry")}
      </button>
    </div>
  );
}
