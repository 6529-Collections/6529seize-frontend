import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { CollectDetailHeader } from "./CollectDetailActionRow";

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
      className="tw-flex tw-flex-col tw-gap-3"
    >
      <span className="tw-sr-only">{t(locale, "collect.detail.loading")}</span>
      <CollectDetailHeader />
      <div
        aria-hidden="true"
        className="tw-grid tw-grid-cols-2 tw-gap-2 max-[399px]:tw-grid-cols-[minmax(0,5fr)_minmax(0,4fr)]"
      >
        <div className="tw-h-11 tw-min-w-0 tw-rounded-lg tw-bg-iron-800" />
        <div className="tw-h-11 tw-min-w-0 tw-rounded-lg tw-bg-iron-800" />
      </div>
      <div
        aria-hidden="true"
        className="-tw-mx-4 -tw-mb-4 tw-mt-1 tw-space-y-3 tw-rounded-b-[11px] tw-bg-iron-950 tw-px-4 tw-py-3"
      >
        <div className="tw-h-[18px] tw-w-4/5 tw-rounded tw-bg-iron-800 max-[479px]:tw-h-9" />
        <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-x-1 tw-gap-y-2">
          <div className="tw-mr-auto tw-h-9 tw-w-36 tw-rounded-lg tw-bg-iron-800 max-[479px]:tw-h-10 max-[479px]:tw-w-full" />
          <div className="tw-h-9 tw-w-28 tw-rounded-lg tw-bg-iron-800" />
          <div className="tw-h-9 tw-w-14 tw-rounded-lg tw-bg-iron-800" />
        </div>
      </div>
    </div>
  );
}
