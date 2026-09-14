"use client";

import { isCollectEdition } from "./collect-families";

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
  prepareMarketOperation,
} from "@/services/api/market-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import type {
  CollectTradeAction,
  CollectTradeDraft,
  CollectTradeStage,
} from "./collect.types";
import { marketOperationStage } from "./market.adapters";
import { validateMarketOperation } from "./market-validation";
import { readMarketIntent, saveMarketIntent } from "./market-operation-storage";
import { knownMarketTransactionHash } from "./market-known-transaction";
import { marketOperationSendAttempt } from "./market-send-recovery";
import CollectTradeControllerForm from "./CollectTradeControllerForm";
import CollectBatchController from "./CollectBatchController";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import CollectTradeSheet, {
  type CollectTradePresentation,
} from "./CollectTradeSheet";
import CollectTransactionRecovery from "./CollectTransactionRecovery";
import { useMarketExecution } from "./useMarketExecution";
import { useMarketSettlement } from "./useMarketSettlement";
import { marketReceiptRefreshInterval } from "./market-receipt-refresh";
import { useCollectOfferIntent } from "./useCollectOfferIntent";
import { marketExecutionError } from "./market-execution-errors";
import { marketPreparationError } from "./market-preparation-errors";
import {
  collectControllerReview,
  collectOfferLimitReason,
} from "./collect-controller-review";
import { useCollectTradeOrders } from "./useCollectTradeOrders";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { useFixedCollectOrder } from "./useFixedCollectOrder";
import { useCollectRecipientUpdate } from "./useCollectRecipientUpdate";
import { usePendingCollectPurchase } from "./usePendingCollectPurchase";
import Link from "next/link";
import {
  collectBuyAmount,
  collectBuyListings,
  collectListingKey,
} from "./collect-buy.helpers";

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

interface CollectTradeControllerProps {
  readonly asset?: ApiCollectAsset;
  readonly action: CollectTradeAction;
  readonly initialOperation?: ApiMarketOperation;
  readonly initialOrder?: ApiMarketTradeOrder;
  readonly fixedOrder?: boolean;
  readonly maximumOrderQuantity?: string;
  readonly initialQuantity?: string;
  readonly initialRecipient?: string;
  readonly initialUnitPriceEth?: string;
  readonly initialExpiryHours?: "24" | "168" | "720" | "custom";
  readonly initialExpiryDateTime?: string;
  readonly maximumOfferAmountWei?: string;
  readonly fixedOfferQuantity?: string;
  readonly cancelTarget?: ApiMarketOperation;
  readonly onClose: () => void;
  readonly onSettled?: () => void;
  readonly onPublished?: (operation: ApiMarketOperation) => void;
  /** Synchronously reserve the full offer amount; throwing prevents publication. */
  readonly onCommitment?: (
    operation: ApiMarketOperation,
    expected: ApiMarketPrepareRequest
  ) => void;
  readonly onMarketChange?: () => void;
  readonly secondaryActions?: ReactNode;
  readonly presentation?: CollectTradePresentation;
  readonly layout?: "standard" | "inline-buy";
}

export default function CollectTradeController(
  props: CollectTradeControllerProps
) {
  const { connectedProfile, activeProfileProxy, isAuthenticated } = useAuth();
  const { address, canSignActiveWallet, isSafeWallet } =
    useSeizeConnectContext();
  // A different offer target, actor or allocation starts a fresh draft. Pending
  // work in the previous controller loses its intent guard when it unmounts.
  const key =
    props.action === "offer" || props.fixedOrder
      ? JSON.stringify([
          props.action,
          props.asset?.asset_key,
          props.initialOperation?.id,
          connectedProfile?.id,
          address?.toLowerCase(),
          isAuthenticated,
          Boolean(activeProfileProxy),
          props.initialQuantity,
          props.initialRecipient,
          props.initialUnitPriceEth,
          props.initialExpiryHours,
          props.initialExpiryDateTime,
          props.maximumOfferAmountWei,
          props.fixedOfferQuantity,
          props.fixedOrder,
          props.maximumOrderQuantity,
          props.fixedOrder ? props.initialOrder : undefined,
          props.fixedOrder
            ? collectProfileWallets(connectedProfile)
                .map((item) => item.wallet.toLowerCase())
                .sort((left, right) => left.localeCompare(right))
            : undefined,
          props.fixedOrder ? canSignActiveWallet : undefined,
          props.fixedOrder ? isSafeWallet : undefined,
        ])
      : undefined;
  return <CollectTradeControllerContent key={key} {...props} />;
}

function CollectTradeControllerContent({
  asset,
  action,
  initialOperation,
  initialOrder,
  fixedOrder = false,
  maximumOrderQuantity,
  initialQuantity,
  initialRecipient,
  initialUnitPriceEth,
  initialExpiryHours,
  initialExpiryDateTime,
  maximumOfferAmountWei,
  fixedOfferQuantity,
  cancelTarget,
  onClose,
  onSettled,
  onPublished,
  onCommitment,
  onMarketChange,
  secondaryActions,
  presentation = "dialog",
  layout = "standard",
}: CollectTradeControllerProps) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, isAuthenticated } = useAuth();
  const connection = useSeizeConnectContext();
  const { isCapacitor } = useCapacitor();
  const client = useQueryClient();
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
    generation: object;
  } | null>(null);
  const assetKey =
    asset?.asset_key ??
    initialOperation?.asset_key ??
    cancelTarget?.asset_key ??
    "";
  const offerQuantity = action === "offer" ? fixedOfferQuantity : undefined;
  const {
    chosenOrder,
    setSelectedOrder,
    setDraft,
    setQuantityEdited,
    orders,
    buyOrders,
    selectedOrder,
    draft,
    needsOrder,
    inlineBuy,
  } = useCollectTradeOrders({
    action,
    assetKey,
    operation,
    preparing: preparing || splitPurchase !== null,
    layout,
    initialOrder,
    fixedOrder,
    initialQuantity: initialQuantity ?? offerQuantity,
    initialRecipient,
    initialUnitPriceEth,
    initialExpiryHours,
    initialExpiryDateTime,
    profile: connectedProfile,
    wallet: connection.address,
  });
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
      if (!latest) return false;
      return marketOperationNeedsPolling(latest)
        ? 5000
        : marketReceiptRefreshInterval(latest);
    },
  });
  const displayedOperation =
    operation &&
    polling.data?.id === operation.id &&
    polling.data.updated_at > operation.updated_at
      ? polling.data
      : operation;
  const offerIntent = useCollectOfferIntent({
    action,
    assetKey,
    draft,
    profileId: connectedProfile?.id ?? undefined,
    wallet: connection.address,
    authenticated: isAuthenticated === true,
    proxy: Boolean(activeProfileProxy),
    maximumOfferAmountWei,
    fixedOfferQuantity,
    initialOperation,
    operation: displayedOperation,
    expected,
    onPublished,
    onCommitment,
  });
  const receiveOperation = (next: ApiMarketOperation) => {
    setOperation((prior) =>
      action === "offer" &&
      prior &&
      (next.id !== prior.id ||
        next.updated_at < prior.updated_at ||
        (next.updated_at === prior.updated_at &&
          next.revision !== prior.revision))
        ? prior
        : next
    );
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
  const offerMaximum = action === "offer" ? maximumOfferAmountWei : undefined;
  const pendingPurchase = usePendingCollectPurchase({
    profileId: connectedProfile?.id ?? undefined,
    assetKey,
    identity: expected?.order ?? selectedOrder?.identity,
    operationId: displayedOperation?.id,
    enabled: action === "buy",
  });
  const connectionDisabledReason = reasonKey
    ? t(locale, reasonKey)
    : collectOfferLimitReason(expected, offerMaximum, locale, offerQuantity);
  const disabledReason =
    connectionDisabledReason ??
    (pendingPurchase.blocked
      ? t(locale, "collect.trade.purchasePending")
      : undefined);
  const pendingAction = pendingPurchase.blocked ? (
    <Link
      href="/collect/orders"
      className="tw-rounded-sm tw-text-sm tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      {t(locale, "collect.activity.viewOrders")}
    </Link>
  ) : null;
  const fixedIntent = useFixedCollectOrder({
    fixed: fixedOrder,
    action,
    assetKey,
    initialOrder,
    draft,
    profileId: connectedProfile?.id ?? undefined,
    profileWallets: collectProfileWallets(connectedProfile).map(
      (item) => item.wallet
    ),
    wallet: connection.address,
    canSign: disabledReason === undefined,
    maximumQuantity: maximumOrderQuantity,
  });
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
      pendingPurchase.assertAvailable();
      let orderForRequest = selectedOrder;
      if (fixedOrder) {
        orderForRequest = await fixedIntent.refresh();
      } else if (inlineBuy && selectedOrder) {
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
      pendingPurchase.assertAvailable(orderForRequest?.identity);
      const request = buildMarketRequest({
        draft: value,
        action,
        profile: connectedProfile,
        wallet: connection.address,
        assetKey,
        selectedOrder: orderForRequest,
        cancelTarget,
      });
      offerIntent.guard(request);
      fixedIntent.guard();
      // Retry a lost prepare response with the same key and exact request body.
      const old = pendingPrepare.current;
      const fingerprint = JSON.stringify({
        draft: value,
        action,
        assetKey,
        profileId: connectedProfile.id,
        wallet: connection.address,
        orderHash: orderForRequest?.identity.order_hash,
        amount: request.amount_wei,
        cancelId: cancelTarget?.id,
      });
      const intent =
        old?.fingerprint === fingerprint &&
        (action !== "offer" || old.generation === offerIntent.generation)
          ? old
          : {
              request,
              key: crypto.randomUUID(),
              fingerprint,
              generation: offerIntent.generation,
            };
      pendingPrepare.current = intent;
      const prepared = await prepareMarketOperation(intent.request, intent.key);
      pendingPurchase.assertAvailable(intent.request.order);
      offerIntent.guard(intent.request);
      fixedIntent.guard();
      validateMarketOperation(prepared, intent.request);
      offerIntent.bind(prepared, intent.request);
      saveMarketIntent(connectedProfile.id, prepared.id, {
        request: intent.request,
      });
      setExpected(intent.request);
      receiveOperation(prepared);
    } catch (failure) {
      try {
        fixedIntent.guard();
      } catch {
        return;
      }
      setError(marketPreparationError(failure, locale));
    } finally {
      setPreparing(false);
    }
  };
  const review = collectControllerReview({
    operation: displayedOperation,
    locale,
    disabledReason:
      disabledReason ??
      (!execution.ready && execution.readinessReason
        ? t(locale, execution.readinessReason)
        : undefined),
    profileId: connectedProfile?.id ?? undefined,
    profile: connectedProfile ?? null,
    asset,
  });
  const stage = reviewStage(displayedOperation, execution.stage, preparing);
  const recipientUpdate = useCollectRecipientUpdate({
    operation: displayedOperation,
    expected,
    profile: connectedProfile,
    wallet: connection.address,
    enabled: action === "buy" && stage === "review" && !disabledReason,
    onUpdated: (next, request) => {
      setDraft((current) => ({
        ...current,
        quantity: request.quantity,
        recipient: request.recipient,
        acknowledgeExternalRecipient: request.acknowledge_external_recipient,
      }));
      setQuantityEdited(true);
      setExpected(request);
      receiveOperation(next);
      setError(undefined);
      execution.clearMessage();
    },
    onError: (failure) => setError(marketPreparationError(failure, locale)),
  });
  const form = (
    <CollectTradeControllerForm
      locale={locale}
      action={action}
      asset={asset}
      needsOrder={needsOrder}
      fixedOrder={fixedOrder}
      maximumOrderQuantity={maximumOrderQuantity}
      inlineBuy={inlineBuy}
      draft={draft}
      fixedOfferQuantity={offerQuantity}
      chosenOrder={chosenOrder}
      selectedOrder={selectedOrder}
      orders={orders.data?.orders ?? []}
      buyOrders={buyOrders}
      ordersLoading={orders.isPending}
      ordersUpdatedAt={orders.dataUpdatedAt}
      ordersFailed={orders.isError}
      makerLabel={connection.address ?? "—"}
      recipientProfile={connectedProfile}
      disabledReason={disabledReason}
      preparing={preparing}
      error={error}
      secondaryActions={secondaryActions}
      onChange={setDraft}
      onQuantityEdited={() => setQuantityEdited(true)}
      onClearSelectedOrder={() => setSelectedOrder(null)}
      onRestoreSelectedOrder={setSelectedOrder}
      onSelectOrder={setSelectedOrder}
      onRefreshOrders={() => {
        if (!inlineBuy) {
          setSelectedOrder(null);
          setError(undefined);
        }
        void orders.refetch();
      }}
      onPrepare={(value) => {
        void prepare(value);
      }}
      onSplitDelivery={
        asset &&
        isCollectEdition(asset.family) &&
        selectedOrder &&
        collectBuyAmount(selectedOrder, draft.quantity) !== null &&
        BigInt(draft.quantity) > 1n
          ? () =>
              setSplitPurchase({
                item: { asset, order: selectedOrder, quantity: draft.quantity },
                recipient: draft.recipient,
              })
          : undefined
      }
      onConnect={connection.seizeConnect}
      showConnect={
        reasonKey === "collect.trade.connectSigner" ||
        reasonKey === "collect.trade.reconnect"
      }
    />
  );
  return (
    <>
      <CollectTradeSheet
        open={!splitPurchase}
        presentation={presentation}
        compact={inlineBuy}
        review={review}
        knownTransactionHash={
          displayedOperation &&
          execution.knownTransaction?.operationId === displayedOperation.id
            ? execution.knownTransaction.hash
            : undefined
        }
        knownTransactionPurpose={
          displayedOperation &&
          execution.knownTransaction?.operationId === displayedOperation.id
            ? execution.knownTransaction.purpose
            : undefined
        }
        title={asset?.name}
        stage={recipientUpdate.pending ? "preparing" : stage}
        recipientEditor={
          action === "buy" && review?.purchase && expected
            ? {
                profile:
                  connectedProfile?.id === displayedOperation?.profile_id
                    ? connectedProfile
                    : null,
                payingWallet: review.purchase.payerAddress,
                disabled: !recipientUpdate.canEdit,
                onApply: async (recipient, acknowledgeExternal) => {
                  setError(undefined);
                  execution.clearMessage();
                  return recipientUpdate.update(recipient, acknowledgeExternal);
                },
              }
            : undefined
        }
        form={form}
        recoveryAction={
          <>
            {pendingAction}
            {displayedOperation &&
              !execution.busy &&
              !execution.stage &&
              !knownMarketTransactionHash(
                displayedOperation,
                marketOperationSendAttempt(displayedOperation),
                readMarketIntent(
                  displayedOperation.profile_id,
                  displayedOperation.id
                )
              ) &&
              marketOperationHasUnresolvedSend(displayedOperation) && (
                <CollectTransactionRecovery
                  key={displayedOperation.id}
                  disabled={
                    !isAuthenticated ||
                    Boolean(activeProfileProxy) ||
                    recipientUpdate.pending
                  }
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
        reviewChangeNotice={execution.reviewChangeNotice}
        onClose={onClose}
        onRefresh={async () => {
          if (displayedOperation) {
            setError(undefined);
            execution.clearMessage();
            try {
              receiveOperation(
                await continueMarketOperation(displayedOperation.id)
              );
            } catch (failure) {
              setError(marketPreparationError(failure, locale));
            }
          } else if (!fixedOrder) await orders.refetch();
          else setError(t(locale, "collect.trade.exactOrderChanged"));
        }}
        onConfirm={async (id, revision) => {
          if (
            displayedOperation &&
            execution.ready &&
            expected &&
            displayedOperation.id === id &&
            displayedOperation.revision === revision
          ) {
            if (action === "offer") {
              try {
                offerIntent.guardReview(displayedOperation, expected);
              } catch (failure) {
                setError(marketExecutionError(failure, locale));
                return;
              }
              const guard = () =>
                offerIntent.guardReview(displayedOperation, expected);
              if (onCommitment)
                await execution.confirm(
                  displayedOperation,
                  expected,
                  guard,
                  offerIntent.reserve
                );
              else await execution.confirm(displayedOperation, expected, guard);
            } else if (action === "buy") {
              await execution.confirm(displayedOperation, expected, () => {
                pendingPurchase.assertAvailable(expected.order);
                recipientUpdate.assertIdle();
                if (fixedOrder) fixedIntent.guard();
              });
            } else if (fixedOrder) {
              await execution.confirm(
                displayedOperation,
                expected,
                fixedIntent.guard
              );
            } else await execution.confirm(displayedOperation, expected);
          }
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
