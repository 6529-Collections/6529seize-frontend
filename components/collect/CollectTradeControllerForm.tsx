"use client";

import { isCollectEdition } from "./collect-families";

import Button from "@/components/utils/button/Button";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { useContext, type ReactNode } from "react";
import CollectDetailLoading from "./CollectDetailLoading";
import CollectInlineBuyForm from "./CollectInlineBuyForm";
import CollectConnectionPrompt from "./CollectConnectionPrompt";
import CollectTradeWalletSummary from "./CollectTradeWalletSummary";
import CollectTradeForm from "./CollectTradeForm";
import CollectDetailActionRow, {
  CollectDetailLayout,
  CollectDetailHeader,
} from "./CollectDetailActionRow";
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
  readonly initialLoading?: boolean;
  readonly ordersLoading: boolean;
  readonly ordersFailed: boolean;
  readonly makerLabel: string;
  readonly recipientProfile: ApiIdentity | null;
  readonly fixedOfferQuantity?: string | undefined;
  readonly disabledReason: string | undefined;
  readonly preparing: boolean;
  readonly error: string | undefined;
  readonly secondaryActions?: ReactNode;
  readonly supportingActions?: ReactNode;
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
    <div data-collect-order-book className="tw-mb-4">
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
  connectionHeader,
}: {
  readonly props: CollectTradeControllerFormProps;
  readonly connectionHeader: boolean;
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
        <CollectDetailHeader>
          <p
            role={props.ordersFailed ? "alert" : "status"}
            className="tw-m-0 tw-text-xs tw-text-iron-500"
          >
            {noInlineOrder}
          </p>
        </CollectDetailHeader>
        {((props.secondaryActions !== undefined &&
          props.secondaryActions !== null) ||
          Boolean(props.supportingActions)) && (
          <CollectDetailActionRow supportingActions={props.supportingActions}>
            {props.secondaryActions}
          </CollectDetailActionRow>
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
      connectionHeader={connectionHeader && noInlineOrder === undefined}
      showDelivery={!connectionHeader}
      loading={props.preparing}
      error={props.error}
      secondaryActions={props.secondaryActions}
      supportingActions={props.supportingActions}
      onChange={inlineDraftChange}
      onPrepare={props.onPrepare}
      onSplitDelivery={props.onSplitDelivery}
      orderOptions={inlineOrderOptions}
    />
  );
}

function StandardTradeForm({
  props,
  connectWalletAction,
  connectionHeader,
}: {
  readonly props: CollectTradeControllerFormProps;
  readonly connectWalletAction: ReactNode;
  readonly connectionHeader: boolean;
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
      connectWalletAction={connectWalletAction}
      connectionHeader={connectionHeader}
      onChange={props.onChange}
      onPrepare={props.onPrepare}
    />
  );
}

function OfferOrdersLoading({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div role="status" className="tw-space-y-4">
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "collect.loading")}
      </p>
      <div
        aria-hidden="true"
        className="tw-animate-pulse tw-space-y-2 motion-reduce:tw-animate-none"
      >
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="tw-flex tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50 tw-p-4"
          >
            <div className="tw-mt-1 tw-size-4 tw-shrink-0 tw-rounded-full tw-bg-iron-800" />
            <div className="tw-min-w-0 tw-flex-1 tw-space-y-3">
              <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
              <div className="tw-h-3 tw-w-4/5 tw-rounded tw-bg-iron-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CollectTradeControllerForm(
  props: CollectTradeControllerFormProps
) {
  const detailLayout = useContext(CollectDetailLayout);
  const loadingDetail =
    Boolean(detailLayout) && props.inlineBuy && props.initialLoading === true;
  // The controller retains draft/query state; do not mount action portals until ready.
  if (loadingDetail) return <CollectDetailLoading locale={props.locale} />;
  const loadingOfferOrders =
    props.action === "accept" &&
    props.needsOrder &&
    !props.inlineBuy &&
    !props.fixedOrder &&
    props.ordersLoading;
  const connectionHeader =
    Boolean(detailLayout) && props.inlineBuy && props.showConnect;
  const connectInsideOffer = !props.inlineBuy && props.action === "offer";
  const connectAboveOrders = !props.inlineBuy && props.action === "accept";
  const orderConnectionHeader = connectAboveOrders && props.showConnect;
  let connectClassName: string | undefined;
  if (connectInsideOffer || connectAboveOrders) {
    connectClassName = "tw-min-h-11 tw-w-full";
  }
  const connectWalletAction = props.showConnect ? (
    <Button
      data-collect-connect-wallet
      variant={
        connectInsideOffer || connectAboveOrders || connectionHeader
          ? "primary"
          : "secondary"
      }
      size={
        connectInsideOffer || connectAboveOrders || connectionHeader
          ? "lg"
          : "md"
      }
      className={connectClassName}
      onClick={props.onConnect}
    >
      {t(props.locale, "collect.connect")}
    </Button>
  ) : null;
  const tradeForm = props.inlineBuy ? (
    <InlineTradeForm props={props} connectionHeader={connectionHeader} />
  ) : (
    <StandardTradeForm
      props={props}
      connectWalletAction={connectInsideOffer ? connectWalletAction : null}
      connectionHeader={orderConnectionHeader}
    />
  );

  const formContent =
    Boolean(detailLayout) && props.inlineBuy ? (
      <div className="tw-space-y-4">
        {connectionHeader && (
          <CollectConnectionPrompt message={props.disabledReason}>
            {connectWalletAction}
          </CollectConnectionPrompt>
        )}
        {tradeForm}
      </div>
    ) : (
      tradeForm
    );

  return (
    <>
      {loadingOfferOrders && <OfferOrdersLoading locale={props.locale} />}
      {/* Keep form state mounted while the initial order list is loading. */}
      <div
        data-collect-order-form
        hidden={loadingOfferOrders}
        className="tw-space-y-6"
      >
        {orderConnectionHeader && (
          <CollectTradeWalletSummary
            action={props.action}
            makerLabel={props.makerLabel}
            message={props.disabledReason}
            connectWalletAction={connectWalletAction}
          />
        )}
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
        <div data-collect-order-footer className="tw-space-y-6">
          {formContent}
          {props.inlineBuy &&
            !props.fixedOrder &&
            !props.ordersLoading &&
            props.ordersFailed && (
              <Button
                variant="secondary"
                size="sm"
                onClick={props.onRefreshOrders}
              >
                {t(props.locale, "collect.retry")}
              </Button>
            )}
          {!connectInsideOffer &&
            !connectAboveOrders &&
            !connectionHeader &&
            connectWalletAction}
        </div>
      </div>
    </>
  );
}
