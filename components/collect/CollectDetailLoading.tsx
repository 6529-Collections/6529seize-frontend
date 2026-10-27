import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "./CollectDetailActionRow.module.css";

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
      className={`${styles["detailLoading"] ?? ""} tw-flex tw-flex-col tw-gap-3`}
    >
      <span className="tw-sr-only">{t(locale, "collect.detail.loading")}</span>
      <div
        aria-hidden="true"
        className="tw-h-3 tw-w-3/4 tw-rounded tw-bg-iron-800"
      />
      <div
        aria-hidden="true"
        className="tw-h-11 tw-w-full tw-rounded-lg tw-bg-iron-800"
      />
      <div
        aria-hidden="true"
        className="tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] tw-gap-2"
      >
        <div className="tw-h-11 tw-min-w-0 tw-rounded-lg tw-bg-iron-800" />
        <div className="tw-h-11 tw-min-w-0 tw-rounded-lg tw-bg-iron-800" />
        <div className="tw-size-11 tw-rounded-lg tw-bg-iron-800" />
      </div>
    </div>
  );
}
