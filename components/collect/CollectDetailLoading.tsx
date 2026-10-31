import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/** One presentation for the detail panel's initial asset, code, and market loads. */
export default function CollectDetailLoading({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <div
      data-collect-detail-loading
      role="status"
      aria-busy="true"
      className="tw-flex tw-flex-col tw-gap-4"
    >
      <span className="tw-sr-only">{t(locale, "collect.detail.loading")}</span>
      <div
        aria-hidden="true"
        className="tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] tw-gap-2"
      >
        <div className="tw-h-11 tw-min-w-0 tw-rounded-md tw-bg-iron-900" />
        <div className="tw-h-11 tw-min-w-0 tw-rounded-md tw-bg-iron-900" />
        <div className="tw-size-11 tw-rounded-md tw-bg-iron-900" />
      </div>
      <div aria-hidden="true" className="tw-flex tw-h-4 tw-items-center">
        <div className="tw-h-2 tw-w-2/5 tw-max-w-40 tw-rounded tw-bg-iron-900" />
      </div>
    </div>
  );
}
