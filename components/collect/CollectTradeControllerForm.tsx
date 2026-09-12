"use client";

import Button from "@/components/utils/button/Button";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import CollectInlineBuyForm from "./CollectInlineBuyForm";
import CollectTradeForm from "./CollectTradeForm";
import { CollectOrderBook } from "./CollectOrderPicker";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import {
  collectBuyAmount,
  collectOrderAvailableQuantity,
  collectOrderQuantityStep,
} from "./collect-buy.helpers";
import { MARKET_ZERO } from "./market-validation";

interface CollectTradeControllerFormProps {
  readonly locale: SupportedLocale;
  readonly action: CollectTradeAction;
  readonly asset: ApiCollectAsset | undefined;
  readonly needsOrder: boolean;
  readonly inlineBuy: boolean;
  readonly draft: CollectTradeDraft;
  readonly chosenOrder: ApiMarketTradeOrder | null;
  readonly selectedOrder: ApiMarketTradeOrder | null;
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly buyOrders: readonly ApiMarketTradeOrder[];
  readonly ordersLoading: boolean;
  readonly ordersFailed: boolean;
  readonly makerLabel: string;
  readonly recipientProfile: ApiIdentity | null;
  readonly fixedOfferQuantity?: string | undefined;
  readonly disabledReason: string | undefined;
  readonly preparing: boolean;
  readonly error: string | undefined;
  readonly onChange: (draft: CollectTradeDraft) => void;
  readonly onQuantityEdited: () => void;
  readonly onClearSelectedOrder: () => void;
  readonly onRestoreSelectedOrder: (order: ApiMarketTradeOrder) => void;
  readonly onSelectOrder: (order: ApiMarketTradeOrder) => void;
  readonly onRefreshOrders: () => void;
  readonly onPrepare: (draft: CollectTradeDraft) => void;
  readonly onSplitDelivery: (() => void) | undefined;
  readonly onConnect: () => void;
  readonly showConnect: boolean;
}

function StandardOrderBook({
  loading,
  failed,
  orders,
  selectedOrder,
  onSelectOrder,
  onRefreshOrders,
  locale,
}: {
  readonly loading: boolean;
  readonly failed: boolean;
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly selectedOrder: ApiMarketTradeOrder | null;
  readonly onSelectOrder: (order: ApiMarketTradeOrder) => void;
  readonly onRefreshOrders: () => void;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-mb-4">
      <CollectOrderBook
        loading={loading}
        failed={failed}
        orders={orders}
        value={selectedOrder?.identity.order_hash ?? null}
        onChange={onSelectOrder}
      />
      <Button variant="secondary" onClick={onRefreshOrders}>
        {t(locale, "collect.trade.refreshOrders")}
      </Button>
    </div>
  );
}

function getNoInlineOrderMessage({
  locale,
  ordersLoading,
  ordersFailed,
  selectedOrder,
}: {
  readonly locale: SupportedLocale;
  readonly ordersLoading: boolean;
  readonly ordersFailed: boolean;
  readonly selectedOrder: ApiMarketTradeOrder | null;
}) {
  if (selectedOrder) return undefined;
  if (ordersFailed) return t(locale, "collect.error.orders");
  return t(
    locale,
    ordersLoading ? "collect.buy.loadingListings" : "collect.trade.noOrders"
  );
}

function InlineTradeForm({
  props,
}: {
  readonly props: CollectTradeControllerFormProps;
}) {
  const noInlineOrder = getNoInlineOrderMessage(props);
  const inlineDraftChange = (next: CollectTradeDraft) => {
    if (next.quantity !== props.draft.quantity) {
      props.onQuantityEdited();
      props.onClearSelectedOrder();
    } else if (!props.chosenOrder && props.selectedOrder) {
      props.onRestoreSelectedOrder(props.selectedOrder);
    }
    props.onChange(next);
  };
  const inlineOrderOptions =
    props.buyOrders.length > 1 ? (
      <details>
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(props.locale, "collect.buy.otherListings")}
        </summary>
        <CollectOrderBook
          loading={props.ordersLoading}
          failed={props.ordersFailed}
          orders={props.buyOrders}
          value={props.selectedOrder?.identity.order_hash ?? null}
          onChange={props.onSelectOrder}
        />
      </details>
    ) : undefined;

  return (
    <CollectInlineBuyForm
      action="buy"
      draft={props.draft}
      maxQuantity={
        (props.selectedOrder
          ? collectOrderAvailableQuantity(props.selectedOrder)
          : null) ?? "1"
      }
      quantityStep={
        props.selectedOrder
          ? (collectOrderQuantityStep(props.selectedOrder) ?? "1")
          : "1"
      }
      makerLabel={props.makerLabel}
      currencyLabel="ETH"
      recipientProfile={props.recipientProfile}
      amountWei={
        props.selectedOrder
          ? collectBuyAmount(props.selectedOrder, props.draft.quantity)
          : null
      }
      disabledReason={noInlineOrder ?? props.disabledReason}
      loading={props.preparing}
      error={props.error}
      onChange={inlineDraftChange}
      onPrepare={props.onPrepare}
      onSplitDelivery={props.onSplitDelivery}
      orderOptions={inlineOrderOptions}
    />
  );
}

function StandardTradeForm({
  props,
}: {
  readonly props: CollectTradeControllerFormProps;
}) {
  return (
    <CollectTradeForm
      action={props.action}
      draft={props.draft}
      maxQuantity={
        props.selectedOrder?.quantity ??
        (props.asset?.family.toString() === "memes" ? "100" : "1")
      }
      makerLabel={props.makerLabel}
      currencyLabel={
        props.selectedOrder?.currency.toLowerCase() === MARKET_ZERO ||
        (!props.selectedOrder && props.action !== "offer")
          ? "ETH"
          : "WETH"
      }
      recipientProfile={props.recipientProfile}
      {...(props.action === "offer" && props.fixedOfferQuantity !== undefined
        ? { fixedOfferQuantity: props.fixedOfferQuantity }
        : {})}
      disabledReason={
        props.disabledReason ??
        (props.needsOrder && !props.selectedOrder
          ? t(props.locale, "collect.trade.selectOrder")
          : undefined)
      }
      loading={props.preparing}
      error={props.error}
      onChange={props.onChange}
      onPrepare={props.onPrepare}
    />
  );
}

export default function CollectTradeControllerForm(
  props: CollectTradeControllerFormProps
) {
  const tradeForm = props.inlineBuy ? (
    <InlineTradeForm props={props} />
  ) : (
    <StandardTradeForm props={props} />
  );

  return (
    <>
      {props.needsOrder && !props.inlineBuy && (
        <StandardOrderBook
          loading={props.ordersLoading}
          failed={props.ordersFailed}
          orders={props.orders}
          selectedOrder={props.selectedOrder}
          onSelectOrder={(order) => {
            props.onSelectOrder(order);
            props.onChange({ ...props.draft, quantity: "1" });
          }}
          onRefreshOrders={props.onRefreshOrders}
          locale={props.locale}
        />
      )}
      {tradeForm}
      {props.inlineBuy &&
        !props.ordersLoading &&
        (!props.selectedOrder ||
          props.error !== undefined ||
          props.ordersFailed) && (
          <Button variant="secondary" size="sm" onClick={props.onRefreshOrders}>
            {t(props.locale, "collect.trade.refreshOrders")}
          </Button>
        )}
      {props.showConnect && (
        <Button variant="secondary" onClick={props.onConnect}>
          {t(props.locale, "collect.connect")}
        </Button>
      )}
    </>
  );
}
