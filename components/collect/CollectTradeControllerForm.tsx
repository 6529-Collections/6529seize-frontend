"use client";

import { isCollectEdition } from "./collect-families";

import Button from "@/components/utils/button/Button";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import type { ReactNode } from "react";
import CollectInlineBuyForm from "./CollectInlineBuyForm";
import CollectTradeForm from "./CollectTradeForm";
import { CollectOrderBook } from "./CollectOrderPicker";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import {
  collectBuyListings,
  collectBuyAmount,
  collectOrderAvailableQuantity,
  collectOrderQuantityStep,
} from "./collect-buy.helpers";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { MARKET_ZERO } from "./market-validation";

interface CollectTradeControllerFormProps {
  readonly locale: SupportedLocale;
  readonly action: CollectTradeAction;
  readonly asset: ApiCollectAsset | undefined;
  readonly needsOrder: boolean;
  readonly fixedOrder?: boolean;
  readonly maximumOrderQuantity?: string | undefined;
  readonly inlineBuy: boolean;
  readonly draft: CollectTradeDraft;
  readonly chosenOrder: ApiMarketTradeOrder | null;
  readonly selectedOrder: ApiMarketTradeOrder | null;
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly buyOrders: readonly ApiMarketTradeOrder[];
  readonly ordersUpdatedAt?: number;
  readonly ordersLoading: boolean;
  readonly ordersFailed: boolean;
  readonly makerLabel: string;
  readonly recipientProfile: ApiIdentity | null;
  readonly fixedOfferQuantity?: string | undefined;
  readonly disabledReason: string | undefined;
  readonly preparing: boolean;
  readonly error: string | undefined;
  readonly secondaryActions?: ReactNode;
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
  preparationFailed,
  orders,
  selectedOrder,
  onSelectOrder,
  onRefreshOrders,
  locale,
}: {
  readonly loading: boolean;
  readonly failed: boolean;
  readonly preparationFailed: boolean;
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
      {(failed || preparationFailed) && (
        <Button variant="secondary" onClick={onRefreshOrders}>
          {t(locale, "collect.retry")}
        </Button>
      )}
    </div>
  );
}

function getNoInlineOrderMessage({
  locale,
  ordersLoading,
  ordersFailed,
  selectedOrder,
  orders,
}: {
  readonly locale: SupportedLocale;
  readonly ordersLoading: boolean;
  readonly ordersFailed: boolean;
  readonly selectedOrder: ApiMarketTradeOrder | null;
  readonly orders: readonly ApiMarketTradeOrder[];
}) {
  if (selectedOrder) return undefined;
  if (ordersFailed) return t(locale, "collect.error.orders");
  if (ordersLoading) return t(locale, "collect.buy.loadingListings");
  return t(
    locale,
    orders.length === 0
      ? "collect.buy.notListed"
      : "collect.buy.noMatchingListing"
  );
}

function InlineTradeForm({
  props,
}: {
  readonly props: CollectTradeControllerFormProps;
}) {
  const noInlineOrder = getNoInlineOrderMessage(props);
  // An eligible alternative supplies edit bounds only, never a selected price or request.
  const quantityOrder =
    props.selectedOrder ??
    (!props.fixedOrder && props.asset
      ? collectBuyListings({
          orders: props.orders,
          assetKey: props.asset.asset_key,
          nowSeconds: (props.ordersUpdatedAt ?? 0) / 1000,
          profileWallets: collectProfileWallets(props.recipientProfile).map(
            (item) => item.wallet
          ),
        })[0]
      : undefined);
  const inlineDraftChange = (next: CollectTradeDraft) => {
    if (next.quantity !== props.draft.quantity) {
      props.onQuantityEdited();
      if (!props.fixedOrder) props.onClearSelectedOrder();
    } else if (!props.chosenOrder && props.selectedOrder) {
      props.onRestoreSelectedOrder(props.selectedOrder);
    }
    props.onChange(next);
  };
  const inlineOrderOptions =
    !props.fixedOrder && props.buyOrders.length > 1 ? (
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

  if (
    !props.fixedOrder &&
    !props.selectedOrder &&
    (props.ordersLoading || props.ordersFailed || !quantityOrder)
  )
    return (
      <div className="tw-space-y-3">
        <p
          role={props.ordersFailed ? "alert" : "status"}
          className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-300"
        >
          {noInlineOrder}
        </p>
        {props.secondaryActions !== undefined &&
          props.secondaryActions !== null && (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              {props.secondaryActions}
            </div>
          )}
      </div>
    );

  return (
    <CollectInlineBuyForm
      action="buy"
      draft={props.draft}
      maxQuantity={
        (props.fixedOrder ? props.maximumOrderQuantity : undefined) ??
        (quantityOrder ? collectOrderAvailableQuantity(quantityOrder) : null) ??
        "1"
      }
      quantityStep={
        quantityOrder ? (collectOrderQuantityStep(quantityOrder) ?? "1") : "1"
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
      secondaryActions={props.secondaryActions}
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
        (props.fixedOrder ? props.maximumOrderQuantity : undefined) ??
        (props.selectedOrder
          ? collectOrderAvailableQuantity(props.selectedOrder)
          : null) ??
        (isCollectEdition(props.asset?.family) ? "100" : "1")
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
      {props.needsOrder && !props.inlineBuy && !props.fixedOrder && (
        <StandardOrderBook
          loading={props.ordersLoading}
          failed={props.ordersFailed}
          preparationFailed={props.error !== undefined && !props.preparing}
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
        !props.fixedOrder &&
        !props.ordersLoading &&
        props.ordersFailed && (
          <Button variant="secondary" size="sm" onClick={props.onRefreshOrders}>
            {t(props.locale, "collect.retry")}
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
