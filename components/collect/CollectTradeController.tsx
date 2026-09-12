"use client";

import {
  fetchRecoverableMarketOperation,
  marketOperationHasUnresolvedSend,
  marketOperationNeedsPolling,
} from "./market-recovery";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import {
  buildMarketRequest,
  marketConnectionReason,
} from "./collect-trade.helpers";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { fetchCollectCapabilities } from "@/services/api/collect-api";
import {
  continueMarketOperation,
  fetchMarketOrders,
  prepareMarketOperation,
} from "@/services/api/market-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import type {
  CollectTradeAction,
  CollectTradeDraft,
  CollectTradeStage,
} from "./collect.types";
import {
  marketAmount,
  marketOperationReview,
  marketOperationStage,
} from "./market.adapters";
import { MARKET_ZERO, validateMarketOperation } from "./market-validation";
import { readMarketIntent, saveMarketIntent } from "./market-operation-storage";
import { CollectOrderBook } from "./CollectOrderPicker";
import CollectTradeForm from "./CollectTradeForm";
import CollectInlineBuyForm from "./CollectInlineBuyForm";
import CollectBatchController from "./CollectBatchController";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import CollectTradeSheet, {
  type CollectTradePresentation,
} from "./CollectTradeSheet";
import CollectTransactionRecovery from "./CollectTransactionRecovery";
import CollectAssetMedia from "./CollectAssetMedia";
import { useMarketExecution } from "./useMarketExecution";
import { useMarketSettlement } from "./useMarketSettlement";
import type { SupportedLocale } from "@/i18n/locales";
import {
  collectProfileWallets,
  defaultCollectRecipient,
} from "./collect-recipient.helpers";
import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
  collectOrderPurchaseQuantity,
  collectOrderAvailableQuantity,
  collectOrderQuantityStep,
} from "./collect-buy.helpers";

function recoveredTransactionFacts(
  operation: ApiMarketOperation | null,
  locale: SupportedLocale
) {
  if (!operation) return [];
  const hash = readMarketIntent(
    operation.profile_id,
    operation.id
  )?.transactionHash;
  return hash
    ? [{ label: t(locale, "collect.trade.transactionHash"), value: hash }]
    : [];
}

function TradeRecoveryAction({
  reviewed,
  reason,
  onConnect,
}: {
  readonly reviewed: boolean;
  readonly reason: ReturnType<typeof marketConnectionReason>;
  readonly onConnect: () => void;
}) {
  const locale = useBrowserLocale();
  if (
    !reviewed ||
    (reason !== "collect.trade.reconnect" &&
      reason !== "collect.trade.connectSigner")
  )
    return null;
  return (
    <Button variant="secondary" fullWidth onClick={onConnect}>
      {t(locale, "collect.connect")}
    </Button>
  );
}

function reviewStage(
  operation: ApiMarketOperation | null,
  executing: CollectTradeStage | null,
  preparing: boolean
): CollectTradeStage {
  if (preparing) return "preparing";
  if (executing) return executing;
  if (!operation) return "review";
  if (marketOperationHasUnresolvedSend(operation)) return "reconciling";
  const stage = marketOperationStage(operation);
  return stage === "review" && marketOperationNeedsPolling(operation)
    ? "reconciling"
    : stage;
}

export default function CollectTradeController({
  asset,
  action,
  initialOperation,
  initialOrder,
  initialQuantity,
  initialRecipient,
  cancelTarget,
  onClose,
  onSettled,
  onMarketChange,
  presentation = "dialog",
  layout = "standard",
}: {
  readonly asset?: ApiCollectAsset;
  readonly action: CollectTradeAction;
  readonly initialOperation?: ApiMarketOperation;
  readonly initialOrder?: ApiMarketTradeOrder;
  readonly initialQuantity?: string;
  readonly initialRecipient?: string;
  readonly cancelTarget?: ApiMarketOperation;
  readonly onClose: () => void;
  readonly onSettled?: () => void;
  readonly onMarketChange?: () => void;
  readonly presentation?: CollectTradePresentation;
  readonly layout?: "standard" | "inline-buy";
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, isAuthenticated } = useAuth();
  const connection = useSeizeConnectContext();
  const { isCapacitor } = useCapacitor();
  const client = useQueryClient();
  const [chosenOrder, setSelectedOrder] = useState<ApiMarketTradeOrder | null>(
    initialOrder ?? null
  );
  const [operation, setOperation] = useState<ApiMarketOperation | null>(
    initialOperation ?? null
  );
  const [expected, setExpected] = useState<ApiMarketPrepareRequest | null>(
    () =>
      initialOperation
        ? (readMarketIntent(initialOperation.profile_id, initialOperation.id)
            ?.request ?? null)
        : null
  );
  const [inputDraft, setDraft] = useState<CollectTradeDraft>({
    quantity: initialQuantity ?? "1",
    unitPriceEth: "",
    expiryHours: "168",
    recipient:
      initialRecipient ??
      defaultCollectRecipient(connectedProfile, connection.address),
  });
  const [quantityEdited, setQuantityEdited] = useState(
    initialQuantity !== undefined
  );
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [splitPurchase, setSplitPurchase] = useState<{
    item: CollectSelectedListing;
    recipient: string;
  } | null>(null);
  const pendingPrepare = useRef<{
    request: ApiMarketPrepareRequest;
    key: string;
    fingerprint: string;
  } | null>(null);
  const assetKey =
    asset?.asset_key ??
    initialOperation?.asset_key ??
    cancelTarget?.asset_key ??
    "";
  const needsOrder = action === "buy" || action === "accept";
  const inlineBuy = layout === "inline-buy" && action === "buy";
  const orders = useQuery({
    queryKey: [QueryKey.MARKET_ORDERS, assetKey, action],
    queryFn: ({ signal }) =>
      fetchMarketOrders(
        assetKey,
        action === "buy" ? "LISTING" : "OFFER",
        signal
      ),
    enabled: needsOrder && !operation && Boolean(assetKey),
    staleTime: 0,
  });
  const buyOrders = inlineBuy
    ? collectBuyListings({
        orders: orders.data?.orders ?? [],
        assetKey,
        ...(quantityEdited ? { quantity: inputDraft.quantity } : {}),
        profileWallets: collectProfileWallets(connectedProfile).map(
          (item) => item.wallet
        ),
        nowSeconds: orders.dataUpdatedAt / 1000,
      })
    : [];
  const selectedOrder =
    chosenOrder ?? (inlineBuy ? (buyOrders[0] ?? null) : null);
  const automaticQuantity = selectedOrder
    ? collectOrderPurchaseQuantity(selectedOrder)
    : null;
  const draft =
    inlineBuy && !quantityEdited && automaticQuantity
      ? { ...inputDraft, quantity: automaticQuantity }
      : inputDraft;
  const capability = useQuery({
    queryKey: [QueryKey.COLLECT_CAPABILITIES],
    queryFn: ({ signal }) => fetchCollectCapabilities(signal),
    staleTime: 0,
  });
  const polling = useQuery({
    queryKey: [QueryKey.MARKET_OPERATION, connectedProfile?.id, operation?.id],
    queryFn: ({ signal }) =>
      fetchRecoverableMarketOperation(
        operation!.id,
        operation!.profile_id,
        signal
      ),
    enabled: Boolean(
      operation &&
      connectedProfile?.id &&
      isAuthenticated &&
      !activeProfileProxy
    ),
    refetchInterval: (query) => {
      const latest = query.state.data ?? operation;
      return latest && marketOperationNeedsPolling(latest) ? 5000 : false;
    },
  });
  const displayedOperation =
    polling.data && operation && polling.data.updated_at > operation.updated_at
      ? polling.data
      : operation;
  const receiveOperation = (next: ApiMarketOperation) => {
    setOperation(next);
    void client.invalidateQueries({
      queryKey: [QueryKey.MARKET_MY_OPERATIONS],
    });
  };
  useMarketSettlement(displayedOperation, onSettled, onMarketChange);
  const execution = useMarketExecution(receiveOperation);
  const reasonKey = marketConnectionReason({
    capabilityEnabled:
      capability.data?.actions.some(
        (item) =>
          item.action.toString() === action.toUpperCase() && item.enabled
      ) === true,
    isProxy: Boolean(activeProfileProxy),
    isSafe: connection.isSafeWallet,
    isNative: isCapacitor,
    isAuthenticated: isAuthenticated === true,
    canSign: connection.canSignActiveWallet,
    address: connection.address,
    profile: connectedProfile,
    operation: displayedOperation,
    hasExpected: expected !== null,
    cancelTarget,
  });
  const disabledReason = reasonKey ? t(locale, reasonKey) : undefined;
  const prepare = async (value: CollectTradeDraft) => {
    if (
      preparing ||
      disabledReason ||
      !connectedProfile?.id ||
      !connection.address ||
      (needsOrder && !selectedOrder)
    )
      return;
    setPreparing(true);
    setError(undefined);
    try {
      let orderForRequest = selectedOrder;
      if (inlineBuy && selectedOrder) {
        const refreshed = await orders.refetch();
        if (refreshed.isError || !refreshed.data)
          throw new Error("ORDER_REFRESH_FAILED");
        const current = collectBuyListings({
          orders: refreshed.data.orders,
          assetKey,
          quantity: value.quantity,
          profileWallets: collectProfileWallets(connectedProfile).map(
            (item) => item.wallet
          ),
          nowSeconds: Date.now() / 1000,
        }).find(
          (item) => collectListingKey(item) === collectListingKey(selectedOrder)
        );
        setSelectedOrder(current ?? null);
        if (
          !current ||
          collectBuyAmount(current, value.quantity) !==
            collectBuyAmount(selectedOrder, value.quantity)
        ) {
          setError(t(locale, "collect.buy.listingChanged"));
          return;
        }
        orderForRequest = current;
      }
      const request = buildMarketRequest({
        draft: value,
        action,
        profile: connectedProfile,
        wallet: connection.address,
        assetKey,
        selectedOrder: orderForRequest,
        cancelTarget,
      });
      // Retry a lost prepare response with the same key and exact request body.
      const old = pendingPrepare.current;
      const fingerprint = JSON.stringify({
        draft: value,
        action,
        assetKey,
        wallet: connection.address,
        orderHash: orderForRequest?.identity.order_hash,
        amount: request.amount_wei,
        cancelId: cancelTarget?.id,
      });
      const intent =
        old?.fingerprint === fingerprint
          ? old
          : { request, key: crypto.randomUUID(), fingerprint };
      pendingPrepare.current = intent;
      const prepared = await prepareMarketOperation(intent.request, intent.key);
      validateMarketOperation(prepared, intent.request);
      saveMarketIntent(connectedProfile.id, prepared.id, {
        request: intent.request,
      });
      setExpected(intent.request);
      receiveOperation(prepared);
    } catch {
      setError(t(locale, "collect.error.prepare"));
    } finally {
      setPreparing(false);
    }
  };
  const review = displayedOperation
    ? {
        ...marketOperationReview(
          displayedOperation,
          locale,
          disabledReason,
          connectedProfile?.id ?? undefined
        ),
        ...(asset
          ? {
              title: asset.name,
              media: (
                <CollectAssetMedia src={asset.image_url} name={asset.name} />
              ),
            }
          : {}),
      }
    : null;
  if (review)
    review.technicalFacts = [
      ...review.technicalFacts,
      ...recoveredTransactionFacts(displayedOperation, locale),
    ];
  if (review && displayedOperation && inlineBuy) {
    review.technicalFacts = [...review.facts, ...review.technicalFacts];
    const fees = displayedOperation.fees.reduce(
      (total, fee) => total + BigInt(fee.amount_wei),
      0n
    );
    const gas = displayedOperation.transaction?.gas_reserve_wei;
    review.facts = [
      {
        label: t(locale, "collect.trade.quantity"),
        value: displayedOperation.quantity,
      },
      {
        label: t(locale, "collect.trade.destination"),
        value: displayedOperation.nft_recipient ?? displayedOperation.recipient,
      },
      {
        label: t(locale, "collect.buy.includedFees"),
        value: marketAmount(fees.toString(), displayedOperation.currency),
      },
      ...(gas
        ? [
            {
              label: t(locale, "collect.trade.gasCap"),
              value: marketAmount(gas, MARKET_ZERO),
            },
          ]
        : []),
    ];
  }
  const stage = reviewStage(displayedOperation, execution.stage, preparing);
  const missingOrderLabel = orders.isPending
    ? "collect.loading"
    : "collect.trade.noOrders";
  const orderStatusLabel = orders.isError
    ? "collect.error.orders"
    : missingOrderLabel;
  const noInlineOrder = selectedOrder ? undefined : t(locale, orderStatusLabel);
  const form = (
    <>
      {needsOrder && !inlineBuy && (
        <div className="tw-mb-4">
          <CollectOrderBook
            loading={orders.isPending}
            failed={orders.isError}
            orders={orders.data?.orders ?? []}
            value={selectedOrder?.identity.order_hash ?? null}
            onChange={(order) => {
              setSelectedOrder(order);
              setDraft((value) => ({ ...value, quantity: "1" }));
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedOrder(null);
              void orders.refetch();
            }}
          >
            {t(locale, "collect.trade.refreshOrders")}
          </Button>
        </div>
      )}
      {inlineBuy ? (
        <CollectInlineBuyForm
          action="buy"
          draft={draft}
          maxQuantity={
            (selectedOrder
              ? collectOrderAvailableQuantity(selectedOrder)
              : null) ?? "1"
          }
          quantityStep={
            selectedOrder
              ? (collectOrderQuantityStep(selectedOrder) ?? "1")
              : "1"
          }
          makerLabel={connection.address ?? "—"}
          currencyLabel="ETH"
          recipientProfile={connectedProfile}
          amountWei={
            selectedOrder
              ? collectBuyAmount(selectedOrder, draft.quantity)
              : null
          }
          disabledReason={disabledReason ?? noInlineOrder}
          loading={preparing}
          error={error}
          onChange={(value) => {
            if (value.quantity !== draft.quantity) {
              setQuantityEdited(true);
              setSelectedOrder(null);
            } else if (!chosenOrder && selectedOrder)
              setSelectedOrder(selectedOrder);
            setDraft(value);
          }}
          onPrepare={(value) => {
            void prepare(value);
          }}
          onSplitDelivery={
            asset?.family.toString() === "memes" &&
            selectedOrder &&
            collectBuyAmount(selectedOrder, draft.quantity) !== null &&
            BigInt(draft.quantity) > 1n
              ? () =>
                  setSplitPurchase({
                    item: {
                      asset,
                      order: selectedOrder,
                      quantity: draft.quantity,
                    },
                    recipient: draft.recipient,
                  })
              : undefined
          }
          orderOptions={
            buyOrders.length > 1 ? (
              <details>
                <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                  {t(locale, "collect.buy.otherListings")}
                </summary>
                <CollectOrderBook
                  loading={orders.isPending}
                  failed={orders.isError}
                  orders={buyOrders}
                  value={selectedOrder?.identity.order_hash ?? null}
                  onChange={setSelectedOrder}
                />
              </details>
            ) : undefined
          }
        />
      ) : (
        <CollectTradeForm
          action={action}
          draft={draft}
          maxQuantity={
            selectedOrder?.quantity ??
            (asset?.family.toString() === "memes" ? "100" : "1")
          }
          makerLabel={connection.address ?? "—"}
          currencyLabel={
            selectedOrder?.currency.toLowerCase() === MARKET_ZERO ||
            (!selectedOrder && action !== "offer")
              ? "ETH"
              : "WETH"
          }
          recipientProfile={connectedProfile}
          disabledReason={
            disabledReason ??
            (needsOrder && !selectedOrder
              ? t(locale, "collect.trade.selectOrder")
              : undefined)
          }
          loading={preparing}
          error={error}
          onChange={setDraft}
          onPrepare={(value) => {
            void prepare(value);
          }}
        />
      )}
      {inlineBuy &&
        !orders.isPending &&
        (!selectedOrder || error !== undefined || orders.isError) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void orders.refetch();
            }}
          >
            {t(locale, "collect.trade.refreshOrders")}
          </Button>
        )}
      {(reasonKey === "collect.trade.connectSigner" ||
        reasonKey === "collect.trade.reconnect") && (
        <Button variant="secondary" onClick={connection.seizeConnect}>
          {t(locale, "collect.connect")}
        </Button>
      )}
    </>
  );
  return (
    <>
      <CollectTradeSheet
        open
        presentation={presentation}
        compact={inlineBuy}
        review={review}
        title={asset?.name}
        stage={stage}
        form={form}
        recoveryAction={
          <>
            {displayedOperation &&
              marketOperationHasUnresolvedSend(displayedOperation) && (
                <CollectTransactionRecovery
                  key={displayedOperation.id}
                  disabled={!isAuthenticated || Boolean(activeProfileProxy)}
                  onRecover={(hash) =>
                    execution.recoverTransaction(displayedOperation, hash)
                  }
                />
              )}
            <TradeRecoveryAction
              reviewed={review !== null}
              reason={reasonKey}
              onConnect={connection.seizeConnect}
            />
          </>
        }
        message={execution.message ?? (displayedOperation ? error : undefined)}
        onClose={onClose}
        onRefresh={() => {
          if (displayedOperation) {
            void continueMarketOperation(displayedOperation.id).then(
              receiveOperation,
              () => setError(t(locale, "collect.error.prepare"))
            );
          } else void orders.refetch();
        }}
        onConfirm={async (id, revision) => {
          if (
            displayedOperation &&
            expected &&
            displayedOperation.id === id &&
            displayedOperation.revision === revision
          )
            await execution.confirm(displayedOperation, expected);
        }}
      />
      {splitPurchase && (
        <CollectBatchController
          items={[splitPurchase.item]}
          initialRecipient={splitPurchase.recipient}
          onClose={() => setSplitPurchase(null)}
          {...(onMarketChange ? { onMarketChange } : {})}
          {...(onSettled ? { onSettled } : {})}
        />
      )}
    </>
  );
}
