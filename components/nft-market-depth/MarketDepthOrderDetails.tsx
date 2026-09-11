"use client";

import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import { ApiMarketOrderSideEnum } from "@/generated/models/ApiMarketOrder";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  formatDate,
  formatDecimal,
  formatInteger,
  getApplicabilityLabel,
  getScopeLabel,
} from "./market-depth-format";

export default function MarketDepthOrderDetails({
  data,
  locale,
  onLoadMore,
  isLoadingMore,
  loadMoreError,
}: {
  readonly data: ApiMarketDepth;
  readonly locale: SupportedLocale;
  readonly onLoadMore: () => void;
  readonly isLoadingMore: boolean;
  readonly loadMoreError: string | null;
}) {
  return (
    <details className="tw-group tw-mt-6 tw-border-t tw-border-solid tw-border-white/10 tw-py-4">
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
        <span>{t(locale, "marketDepth.orders.title")}</span>
        <span className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-font-normal tw-text-iron-500">
          {t(locale, "marketDepth.orders.count", {
            count: formatInteger(locale, String(data.order_count)),
          })}
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
          />
        </span>
      </summary>
      <div className="tw-pb-2 tw-pt-3">
        {data.orders.length === 0 ? (
          <p className="tw-m-0 tw-text-sm tw-text-iron-500">
            {t(locale, "marketDepth.orders.none")}
          </p>
        ) : (
          <div
            role="region"
            tabIndex={0}
            aria-label={t(locale, "marketDepth.orders.scrollRegion")}
            className="tw-max-h-[28rem] tw-overflow-auto focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <table className="tw-w-full tw-min-w-[42rem] tw-border-collapse tw-text-left tw-text-xs">
              <caption className="tw-sr-only">
                {t(locale, "marketDepth.orders.caption")}
              </caption>
              <thead className="tw-sticky tw-top-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                <tr>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.side")}
                  </th>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.scope")}
                  </th>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.applicability")}
                  </th>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.price")}
                  </th>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.currency")}
                  </th>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.remaining")}
                  </th>
                  <th scope="col" className="tw-px-2 tw-py-2.5">
                    {t(locale, "marketDepth.orders.expires")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr
                    key={order.order_key}
                    className="tw-border-b tw-border-solid tw-border-white/5 last:tw-border-white/10"
                  >
                    <td className="tw-px-2 tw-py-3 tw-font-medium tw-text-iron-100">
                      {order.side === ApiMarketOrderSideEnum.Ask
                        ? t(locale, "marketDepth.orders.ask")
                        : t(locale, "marketDepth.orders.bid")}
                    </td>
                    <td className="tw-px-2 tw-py-3 tw-text-iron-300">
                      {getScopeLabel(locale, order.scope)}
                    </td>
                    <td className="tw-px-2 tw-py-3 tw-text-iron-300">
                      {getApplicabilityLabel(locale, order.applicability)}
                    </td>
                    <td className="tw-px-2 tw-py-3 tw-tabular-nums tw-text-iron-200">
                      {formatDecimal(locale, order.unit_price)}
                    </td>
                    <td className="tw-px-2 tw-py-3 tw-text-iron-300">
                      <div>{order.currency.symbol}</div>
                      <div
                        title={order.currency.address}
                        className="tw-break-all tw-text-xs tw-text-iron-500"
                      >
                        {order.currency.address}
                      </div>
                    </td>
                    <td className="tw-px-2 tw-py-3 tw-tabular-nums tw-text-iron-300">
                      {formatInteger(locale, order.remaining_quantity)}
                    </td>
                    <td className="tw-px-2 tw-py-3 tw-text-iron-400">
                      {formatDate(order.expires_at, locale) ??
                        t(locale, "marketDepth.orders.noExpiry")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.next && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-sm tw-bg-transparent tw-px-0 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400 tw-underline-offset-4 tw-transition hover:tw-text-white hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60"
          >
            {isLoadingMore && (
              <ArrowPathIcon
                aria-hidden="true"
                className="tw-h-4 tw-w-4 tw-animate-spin motion-reduce:tw-animate-none"
              />
            )}
            {isLoadingMore
              ? t(locale, "marketDepth.orders.loadingMore")
              : t(locale, "marketDepth.orders.loadMore")}
          </button>
        )}
        {loadMoreError && (
          <p
            role="alert"
            className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-rose-300"
          >
            {loadMoreError}
          </p>
        )}
      </div>
    </details>
  );
}
