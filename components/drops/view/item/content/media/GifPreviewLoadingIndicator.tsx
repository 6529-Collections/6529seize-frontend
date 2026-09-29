import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function GifPreviewLoadingIndicator() {
  return (
    <output
      aria-label={t(DEFAULT_LOCALE, "drop.media.loading")}
      className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-z-10 tw-h-full tw-max-h-64 tw-w-64 tw-max-w-full"
    >
      <span className="tw-sr-only">
        {t(DEFAULT_LOCALE, "drop.media.loading")}
      </span>
      <span
        aria-hidden="true"
        className="tw-block tw-h-full tw-w-full tw-rounded-xl tw-bg-iron-800 motion-safe:tw-animate-pulse"
      />
    </output>
  );
}
