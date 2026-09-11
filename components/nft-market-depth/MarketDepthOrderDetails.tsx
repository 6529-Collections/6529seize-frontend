"use client";

import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import type { ApiMarketOrder } from "@/generated/models/ApiMarketOrder";
import { ApiMarketOrderSideEnum } from "@/generated/models/ApiMarketOrder";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  formatDate,
  formatDecimal,
  formatInteger,
  getApplicabilityLabel,
  getScopeLabel,
} from "./market-depth-format";
import { getOtherOrderCount, getOtherOrders } from "./market-depth-orders";

const INITIAL_ORDER_COUNT = 5;
const QUIET_BUTTON =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-sm tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-300 tw-underline-offset-4 hover:tw-text-white hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

interface OrderDetailsProps {
  readonly orders: readonly ApiMarketOrder[];
  readonly expectedCount: number;
  readonly locale: SupportedLocale;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly onRefresh: () => void;
  readonly showPrice?: boolean;
}

function OrderInformation({
  order,
  locale,
}: {
  readonly order: ApiMarketOrder;
  readonly locale: SupportedLocale;
}) {
  const fields = [
    ["marketDepth.orders.maker", order.maker],
    ["marketDepth.orders.reference", order.order_id],
    ["marketDepth.orders.currencyContract", order.currency.address],
  ] as const;

  return (
    <details className="tw-group/order tw-mt-1">
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
        {t(locale, "marketDepth.orders.information")}
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-h-3 tw-w-3 tw-transition-transform group-open/order:tw-rotate-180 motion-reduce:tw-transition-none"
        />
      </summary>
      <dl className="tw-m-0 tw-space-y-3 tw-pb-2 tw-text-xs">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="tw-text-iron-500">{t(locale, label)}</dt>
            <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-iron-300">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function IndividualOrder({
  order,
  locale,
  showPrice,
}: {
  readonly order: ApiMarketOrder;
  readonly locale: SupportedLocale;
  readonly showPrice: boolean;
}) {
  return (
    <li className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-py-4 last:tw-border-b-0">
      {showPrice && (
        <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {t(
            locale,
            order.side === ApiMarketOrderSideEnum.Ask
              ? "marketDepth.orders.ask"
              : "marketDepth.orders.bid"
          )}
          {" · "}
          {formatDecimal(locale, order.unit_price)} {order.currency.symbol}
        </p>
      )}
      <dl className="tw-m-0 tw-grid tw-grid-cols-2 tw-gap-x-5 tw-gap-y-2 tw-text-xs">
        <div>
          <dt className="tw-text-iron-500">
            {t(locale, "marketDepth.orders.quotedQuantity")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-break-words tw-tabular-nums tw-text-iron-200">
            {formatInteger(locale, order.remaining_quantity)}
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-500">
            {t(locale, "marketDepth.orders.expires")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-text-iron-200">
            {formatDate(order.expires_at, locale) ??
              t(locale, "marketDepth.orders.noExpiry")}
          </dd>
        </div>
      </dl>
      <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400">
        {getScopeLabel(locale, order.scope)}
        {" · "}
        {getApplicabilityLabel(locale, order.applicability)}
      </p>
      <OrderInformation order={order} locale={locale} />
    </li>
  );
}

export default function MarketDepthOrderDetails({
  orders,
  expectedCount,
  locale,
  isLoading,
  error,
  onRetry,
  onRefresh,
  showPrice = false,
}: OrderDetailsProps) {
  const [showAll, setShowAll] = useState(false);
  if (error) {
    return (
      <div className="tw-py-4">
        <p role="alert" className="tw-m-0 tw-text-xs tw-text-rose-200">
          {error}
        </p>
        <button type="button" onClick={onRetry} className={QUIET_BUTTON}>
          {t(locale, "marketDepth.orders.retryDetails")}
        </button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <output
        aria-live="polite"
        className="tw-my-4 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400"
      >
        <ArrowPathIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-animate-spin motion-reduce:tw-animate-none"
        />
        {t(locale, "marketDepth.orders.loadingDetails")}
      </output>
    );
  }
  if (orders.length !== expectedCount) {
    return (
      <div className="tw-py-4">
        <p role="alert" className="tw-m-0 tw-text-xs tw-text-iron-300">
          {t(locale, "marketDepth.orders.changed")}
        </p>
        <button type="button" onClick={onRefresh} className={QUIET_BUTTON}>
          {t(locale, "marketDepth.refresh")}
        </button>
      </div>
    );
  }
  const visibleOrders = showAll ? orders : orders.slice(0, INITIAL_ORDER_COUNT);
  return (
    <div>
      <ul
        aria-label={t(
          locale,
          showPrice
            ? "marketDepth.orders.otherListLabel"
            : "marketDepth.orders.listLabel"
        )}
        className="tw-m-0 tw-list-none tw-p-0"
      >
        {visibleOrders.map((order) => (
          <IndividualOrder
            key={order.order_key}
            order={order}
            locale={locale}
            showPrice={showPrice}
          />
        ))}
      </ul>
      {orders.length > INITIAL_ORDER_COUNT && (
        <button
          type="button"
          className={QUIET_BUTTON}
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll
            ? t(locale, "marketDepth.orders.showFewer")
            : t(locale, "marketDepth.orders.showAll", {
                count: formatInteger(locale, String(orders.length)),
              })}
        </button>
      )}
    </div>
  );
}

export function MarketDepthOtherOrders({
  data,
  locale,
  isLoading,
  error,
  onRetry,
  onRefresh,
}: Omit<OrderDetailsProps, "orders" | "expectedCount" | "showPrice"> & {
  readonly data: ApiMarketDepth;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const count = getOtherOrderCount(data);
  if (count === 0) return null;
  return (
    <details
      className="tw-group/other tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-4"
      onToggle={(event) => {
        const open = event.currentTarget.open;
        setIsOpen(open);
        if (open) onRetry();
      }}
    >
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
        {t(locale, "marketDepth.orders.otherTitle", {
          count: formatInteger(locale, String(count)),
        })}
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-shrink-0 tw-transition-transform group-open/other:tw-rotate-180 motion-reduce:tw-transition-none"
        />
      </summary>
      {isOpen && (
        <div className="tw-max-w-2xl tw-pt-2">
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "marketDepth.orders.otherDescription")}
          </p>
          <MarketDepthOrderDetails
            orders={getOtherOrders(data)}
            expectedCount={count}
            locale={locale}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
            onRefresh={onRefresh}
            showPrice
          />
        </div>
      )}
    </details>
  );
}
