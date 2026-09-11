"use client";

import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import { ApiMarketOrderSideEnum } from "@/generated/models/ApiMarketOrder";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
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
    <details className="tw-group tw-mt-5 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
      <summary className="tw-flex tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-font-semibold tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
        <span>
          {t(locale, "marketDepth.orders.title", {
            count: formatInteger(locale, String(data.order_count)),
          })}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-iron-500 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
        />
      </summary>
      <div className="tw-mt-3">
        {data.orders.length === 0 ? (
          <p className="tw-m-0 tw-text-sm tw-text-iron-500">
            {t(locale, "marketDepth.orders.none")}
          </p>
        ) : (
          <div className="tw-max-h-[28rem] tw-overflow-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/5">
            <table className="tw-w-full tw-min-w-[42rem] tw-border-collapse tw-text-left tw-text-xs">
              <caption className="tw-sr-only">
                {t(locale, "marketDepth.orders.caption")}
              </caption>
              <thead className="tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/20 tw-font-medium tw-text-iron-500">
                <tr>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.side")}</th>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.scope")}</th>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.applicability")}</th>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.price")}</th>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.currency")}</th>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.remaining")}</th>
                  <th scope="col" className="tw-px-3 tw-py-2">{t(locale, "marketDepth.orders.expires")}</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.order_key} className="tw-border-b tw-border-solid tw-border-white/5 last:tw-border-b-0">
                    <td className="tw-px-3 tw-py-2 tw-font-semibold tw-uppercase tw-text-white">
                      {order.side === ApiMarketOrderSideEnum.Ask
                        ? t(locale, "marketDepth.orders.ask")
                        : t(locale, "marketDepth.orders.bid")}
                      <span className="tw-ml-1 tw-font-normal tw-text-iron-500">{order.currency.symbol}</span>
                    </td>
                    <td className="tw-px-3 tw-py-2 tw-text-iron-300">{getScopeLabel(locale, order.scope)}</td>
                    <td className="tw-px-3 tw-py-2 tw-text-iron-300">{getApplicabilityLabel(locale, order.applicability)}</td>
                    <td className="tw-px-3 tw-py-2 tw-text-iron-200">{formatDecimal(locale, order.unit_price)}</td>
                    <td className="tw-px-3 tw-py-2 tw-text-iron-300">
                      <div>{order.currency.symbol}</div>
                      <div title={order.currency.address} className="tw-break-all tw-text-[10px] tw-text-iron-500">{order.currency.address}</div>
                    </td>
                    <td className="tw-px-3 tw-py-2 tw-text-iron-300">{formatInteger(locale, order.remaining_quantity)}</td>
                    <td className="tw-px-3 tw-py-2 tw-text-iron-400">
                      {formatDate(order.expires_at, locale) ?? t(locale, "marketDepth.orders.noExpiry")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.next && (
          <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60"
            >
              {isLoadingMore && <ArrowPathIcon aria-hidden="true" className="tw-h-4 tw-w-4 tw-animate-spin motion-reduce:tw-animate-none" />}
              {isLoadingMore ? t(locale, "marketDepth.orders.loadingMore") : t(locale, "marketDepth.orders.loadMore")}
            </button>
          </div>
        )}
        {loadMoreError && <p role="alert" className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-rose-300">{loadMoreError}</p>}
      </div>
    </details>
  );
}
