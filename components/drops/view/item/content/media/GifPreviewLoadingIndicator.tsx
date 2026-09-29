import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function GifPreviewLoadingIndicator() {
  return (
    <output
      aria-label={t(DEFAULT_LOCALE, "drop.media.loading")}
      className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center"
    >
      <span className="tw-sr-only">
        {t(DEFAULT_LOCALE, "drop.media.loading")}
      </span>
      <span
        aria-hidden="true"
        className="tw-block tw-size-6 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-100/30 tw-border-t-iron-100 motion-safe:tw-animate-spin"
      />
    </output>
  );
}
