"use client";

import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
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
    <fieldset className="tw-mx-0 tw-mb-5 tw-min-w-0 tw-space-y-2 tw-border-0 tw-p-0">
      <legend className="tw-mb-2 tw-p-0 tw-text-sm tw-font-medium tw-text-iron-300">
        {t(locale, "collect.trade.selectOrder")}
      </legend>
      {orders.map((order) => (
        <CommonBorderedRadioButton
          key={order.identity.order_hash}
          type={order.identity.order_hash}
          selected={value ?? ""}
          name={id}
          variant="subtle"
          nativeSelection
          multiline
          onChange={() => onChange(order)}
        >
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
        </CommonBorderedRadioButton>
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
