"use client";

import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId } from "react";
import { marketAmount } from "./market.adapters";

function CollectOrderPicker({
  orders,
  value,
  onChange,
}: {
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly value: string | null;
  readonly onChange: (order: ApiMarketTradeOrder) => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  return (
    <fieldset className="tw-mb-5 tw-min-w-0 tw-space-y-2 tw-border-0 tw-p-0">
      <legend className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-iron-100">
        {t(locale, "collect.trade.selectOrder")}
      </legend>
      {orders.map((order) => (
        <label
          key={order.identity.order_hash}
          className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3"
        >
          <input
            type="radio"
            name={id}
            value={order.identity.order_hash}
            checked={value === order.identity.order_hash}
            onChange={() => onChange(order)}
            className="tw-mt-1 tw-size-4 tw-shrink-0 tw-accent-primary-500"
          />
          <span className="tw-min-w-0 tw-space-y-1">
            <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
              {marketAmount(order.total_wei, order.currency)}
            </span>
            <span className="tw-block tw-text-xs tw-text-iron-400">
              {t(locale, "collect.trade.orderQuantity", {
                quantity: order.quantity,
              })}
            </span>
            <span className="tw-block tw-break-all tw-text-xs tw-text-iron-400">
              {t(locale, "collect.trade.orderMaker", { wallet: order.maker })}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function CollectOrderBook({
  loading,
  failed,
  orders,
  value,
  onChange,
}: {
  readonly loading: boolean;
  readonly failed: boolean;
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly value: string | null;
  readonly onChange: (order: ApiMarketTradeOrder) => void;
}) {
  const locale = useBrowserLocale();
  if (loading) return <p role="status">{t(locale, "collect.loading")}</p>;
  if (failed) return <p role="alert">{t(locale, "collect.error.orders")}</p>;
  if (orders.length === 0) return <p>{t(locale, "collect.trade.noOrders")}</p>;
  return (
    <CollectOrderPicker orders={orders} value={value} onChange={onChange} />
  );
}
