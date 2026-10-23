import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function MarketDepthAboutPrices({
  data,
  locale,
}: {
  readonly data: ApiMarketDepth;
  readonly locale: SupportedLocale;
}) {
  const hasUnpricedCollectionOrders = data.snapshots.some(
    (snapshot) => snapshot.unsupported_count > 0
  );

  return (
    <details className="tw-group tw-min-w-0">
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-start tw-gap-2 tw-rounded-lg tw-text-meta tw-font-medium tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-min-h-8 sm:touch-only:tw-min-h-11 [&::-webkit-details-marker]:tw-hidden">
        {t(locale, "marketDepth.about.title")}
        <span
          aria-hidden="true"
          className="tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center tw-text-xl tw-font-normal tw-leading-none tw-text-iron-400 tw-transition-transform group-open:tw-rotate-45 motion-reduce:tw-transition-none"
        >
          +
        </span>
      </summary>
      <div className="tw-mt-1.5 tw-rounded-xl tw-bg-white/[0.025] tw-px-5 tw-py-4 tw-text-xs tw-leading-5 tw-text-iron-400">
        <p className="tw-m-0">{t(locale, "marketDepth.about.description")}</p>
        {hasUnpricedCollectionOrders && (
          <p className="tw-mb-0 tw-mt-2">
            {t(locale, "marketDepth.unpricedOrders")}
          </p>
        )}
        {data.criteria_order_count > 0 && (
          <p className="tw-mb-0 tw-mt-2">
            {t(
              locale,
              data.criteria_order_count === 1
                ? "marketDepth.criteriaSummary.single"
                : "marketDepth.criteriaSummary",
              { count: data.criteria_order_count }
            )}
          </p>
        )}
        {data.notes.length > 0 && (
          <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-4">
            {data.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
