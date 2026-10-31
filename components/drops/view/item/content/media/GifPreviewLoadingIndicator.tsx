import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export type GifPreviewLoadingLayout = "inline" | "artwork";

export function GifPreviewLoadingIndicator({
  layout = "inline",
}: {
  readonly layout?: GifPreviewLoadingLayout | undefined;
}) {
  const isArtwork = layout === "artwork";
  return (
    <output
      aria-label={t(DEFAULT_LOCALE, "drop.media.loading")}
      className={`tw-pointer-events-none tw-absolute tw-z-10 ${
        isArtwork
          ? "tw-inset-0 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800/40"
          : "tw-left-0 tw-top-0 tw-h-full tw-max-h-64 tw-w-64 tw-max-w-full"
      }`}
    >
      <span className="tw-sr-only">
        {t(DEFAULT_LOCALE, "drop.media.loading")}
      </span>
      <span
        aria-hidden="true"
        className={
          isArtwork
            ? "tw-block tw-size-8 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-100/30 tw-border-t-iron-100 motion-safe:tw-animate-spin"
            : "tw-block tw-h-full tw-w-full tw-rounded-xl tw-bg-iron-800 motion-safe:tw-animate-pulse"
        }
      />
    </output>
  );
}
