"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import {
  collectOrderAvailableQuantity,
  collectOrderPurchaseQuantity,
} from "@/components/collect/collect-buy.helpers";
import type { CollectSelectedListing } from "@/components/collect/collect-selection.helpers";
import { collectProfileWallets } from "@/components/collect/collect-recipient.helpers";
import { MARKET_BATCH_LIMITS } from "@/components/collect/market-batch-validation";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import type { SupportedLocale } from "@/i18n/locales";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { fetchCollectAssetOwnership } from "@/services/api/collect-api";
import { fetchExactMarketOrder } from "@/services/api/market-api";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMarketDepthCollectAsset,
  marketDepthCollectFamily,
  marketDepthListingSelection,
  marketDepthListingQuantityIsValid,
  marketDepthOfferIsExecutable,
  marketDepthSelectionConflict,
  matchFreshMarketDepthOrder,
  signerOfferQuantityCap,
  type MarketDepthListingSelection,
} from "./market-depth-trade.helpers";

const CollectBatchController = lazy(
  () => import("@/components/collect/CollectBatchController")
);
const CollectTradeController = lazy(
  () => import("@/components/collect/CollectTradeController")
);

const ACTION_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white";

interface RowState {
  readonly busy: boolean;
  readonly message?: string;
  readonly error?: boolean;
  readonly connectAction?: boolean;
}

interface AcceptedOffer {
  readonly asset: ApiCollectAsset;
  readonly order: ApiMarketTradeOrder;
  readonly quantity: string;
  readonly maximumQuantity: string;
  readonly opener: HTMLButtonElement;
}

interface AcceptAttempt {
  readonly controller: AbortController;
  readonly generation: number;
  readonly orderKey: string;
}

interface TradeContextValue {
  readonly selected: readonly MarketDepthListingSelection[];
  readonly rowStates: Readonly<Record<string, RowState>>;
  readonly selectionBusy: boolean;
  readonly toggleListing: (order: ApiMarketOrder) => void;
  readonly updateQuantity: (order: ApiMarketOrder, quantity: string) => void;
  readonly acceptOffer: (
    order: ApiMarketOrder,
    trigger: HTMLButtonElement
  ) => void;
  readonly connectOwnerWallet: () => void;
}

const TradeContext = createContext<TradeContextValue | null>(null);

const same = (left: string, right: string) =>
  left.toLowerCase() === right.toLowerCase();

function rowMatches(
  item: MarketDepthListingSelection,
  order: ApiMarketOrder
): boolean {
  return (
    same(item.order.identity.protocol_address, order.protocol) &&
    same(item.order.identity.order_hash, order.order_id)
  );
}

function actionWallets(
  profile: ReturnType<typeof useAuth>["connectedProfile"],
  connectedAddress: string | undefined
): string[] {
  const wallets: string[] = collectProfileWallets(profile).map(
    (item) => item.wallet
  );
  if (!connectedAddress) return wallets;
  if (!wallets.some((wallet) => same(wallet, connectedAddress)))
    wallets.push(connectedAddress);
  return wallets;
}

function rowErrorState(error: unknown, locale: SupportedLocale): RowState {
  const code = error instanceof Error ? error.message : "";
  const status = getStructuredApiErrorStatus(error);
  let key: Parameters<typeof t>[1] = "marketDepth.trade.checkFailed";
  if (code === "MARKET_DEPTH_OWNER_REQUIRED")
    key = "marketDepth.trade.ownerRequired";
  else if (code === "MARKET_DEPTH_OVERLAP") key = "marketDepth.trade.overlap";
  else if (code === "MARKET_DEPTH_SELECTION_LIMIT")
    key = "marketDepth.trade.limit";
  else if (code === "MARKET_DEPTH_UNSUPPORTED" || status === 400)
    key = "marketDepth.trade.unsupported";
  else if (code === "MARKET_DEPTH_CHANGED" || status === 409)
    key = "marketDepth.trade.changed";
  return {
    busy: false,
    error: true,
    connectAction: code === "MARKET_DEPTH_OWNER_REQUIRED",
    message:
      key === "marketDepth.trade.limit"
        ? t(locale, key, {
            count: formatNumber(locale, MARKET_BATCH_LIMITS.orders),
          })
        : t(locale, key),
  };
}

function TradeLoading({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-400">
      {t(locale, "marketDepth.trade.loading")}
    </p>
  );
}

export function MarketDepthTradeProvider({
  contract,
  tokenId,
  locale,
  onMarketChange,
  children,
}: {
  readonly contract: string;
  readonly tokenId: string;
  readonly locale: SupportedLocale;
  readonly onMarketChange: () => void;
  readonly children: ReactNode;
}) {
  if (marketDepthCollectFamily(contract) === null) return children;
  return (
    <MarketDepthTradeScope
      contract={contract}
      tokenId={tokenId}
      locale={locale}
      onMarketChange={onMarketChange}
    >
      {children}
    </MarketDepthTradeScope>
  );
}

function MarketDepthTradeScope(
  props: Parameters<typeof SupportedMarketDepthTradeProvider>[0]
) {
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const membership = collectProfileWallets(auth.connectedProfile)
    .map((item) => item.wallet.toLowerCase())
    .sort((left, right) => left.localeCompare(right));
  const actorKey = JSON.stringify([
    props.contract.toLowerCase(),
    props.tokenId,
    auth.connectedProfile?.id ?? "public",
    membership,
    connection.address?.toLowerCase() ?? "",
    auth.isAuthenticated,
    Boolean(auth.activeProfileProxy),
    connection.canSignActiveWallet,
    connection.isSafeWallet,
  ]);
  return <SupportedMarketDepthTradeProvider key={actorKey} {...props} />;
}

function SupportedMarketDepthTradeProvider({
  contract,
  tokenId,
  locale,
  onMarketChange,
  children,
}: {
  readonly contract: string;
  readonly tokenId: string;
  readonly locale: SupportedLocale;
  readonly onMarketChange: () => void;
  readonly children: ReactNode;
}) {
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const [selected, setSelectedState] = useState<
    readonly MarketDepthListingSelection[]
  >([]);
  const selectedRef = useRef(selected);
  const selectionGeneration = useRef(0);
  const reviewBusyRef = useRef(false);
  const [rowStates, setRowStates] = useState<
    Readonly<Record<string, RowState>>
  >({});
  const [reviewItems, setReviewItems] = useState<
    readonly CollectSelectedListing[] | null
  >(null);
  const [acceptedOffer, setAcceptedOffer] = useState<AcceptedOffer | null>(
    null
  );
  const [reviewState, setReviewState] = useState<RowState>({ busy: false });
  const assetRef = useRef<ApiCollectAsset | null>(null);
  const abortControllers = useRef(new Set<AbortController>());
  const acceptGeneration = useRef(0);
  const acceptAttempt = useRef<AcceptAttempt | null>(null);
  const reviewOpener = useRef<HTMLButtonElement | null>(null);

  const setSelected = useCallback(
    (next: readonly MarketDepthListingSelection[]) => {
      selectionGeneration.current++;
      selectedRef.current = next;
      setSelectedState(next);
    },
    []
  );

  useEffect(
    () => () => {
      for (const controller of Array.from(abortControllers.current))
        controller.abort();
      abortControllers.current.clear();
    },
    []
  );

  const loadAsset = useCallback(
    async (signal: AbortSignal) => {
      if (assetRef.current) return assetRef.current;
      const asset = await fetchMarketDepthCollectAsset(
        contract,
        tokenId,
        signal
      );
      signal.throwIfAborted();
      assetRef.current = asset;
      return asset;
    },
    [contract, tokenId]
  );

  const resolveOrder = useCallback(
    async (
      depthOrder: ApiMarketOrder,
      side: ApiMarketTradeOrderSideEnum,
      signal: AbortSignal
    ) => {
      const asset = await loadAsset(signal);
      signal.throwIfAborted();
      const order = await fetchExactMarketOrder(
        depthOrder.order_id,
        depthOrder.protocol,
        asset.asset_key,
        side,
        signal
      );
      signal.throwIfAborted();
      const match = matchFreshMarketDepthOrder({
        order,
        depthOrder,
        assetKey: asset.asset_key,
        side,
        nowSeconds: Date.now() / 1000,
      });
      if (!match.order)
        throw new Error(`MARKET_DEPTH_${match.reason.toUpperCase()}`);
      return { asset, order: match.order };
    },
    [loadAsset]
  );

  const runForRow = useCallback(
    async (
      order: ApiMarketOrder,
      work: (signal: AbortSignal) => Promise<void>,
      suppliedController?: AbortController
    ) => {
      const controller = suppliedController ?? new AbortController();
      abortControllers.current.add(controller);
      setRowStates((current) => ({
        ...current,
        [order.order_key]: {
          busy: true,
          message: t(locale, "marketDepth.trade.checking"),
        },
      }));
      try {
        await work(controller.signal);
        if (!controller.signal.aborted)
          setRowStates((current) => ({
            ...current,
            [order.order_key]: { busy: false },
          }));
      } catch (error) {
        if (!controller.signal.aborted)
          setRowStates((current) => ({
            ...current,
            [order.order_key]: rowErrorState(error, locale),
          }));
      } finally {
        abortControllers.current.delete(controller);
      }
    },
    [locale]
  );

  const invalidateAcceptAttempt = useCallback(() => {
    acceptGeneration.current += 1;
    const current = acceptAttempt.current;
    if (!current) return;
    current.controller.abort();
    acceptAttempt.current = null;
    setRowStates((states) => ({
      ...states,
      [current.orderKey]: { busy: false },
    }));
  }, []);

  const profileWallets = useMemo(
    () => actionWallets(auth.connectedProfile, connection.address),
    [auth.connectedProfile, connection.address]
  );

  const toggleListing = useCallback(
    (depthOrder: ApiMarketOrder) => {
      if (reviewBusyRef.current) return;
      const existing = selectedRef.current.find((item) =>
        rowMatches(item, depthOrder)
      );
      if (existing) {
        setSelected(
          selectedRef.current.filter((item) => !rowMatches(item, depthOrder))
        );
        return;
      }
      void runForRow(depthOrder, async (signal) => {
        if (selectedRef.current.length >= MARKET_BATCH_LIMITS.orders)
          throw new Error("MARKET_DEPTH_SELECTION_LIMIT");
        const { asset, order } = await resolveOrder(
          depthOrder,
          ApiMarketTradeOrderSideEnum.Listing,
          signal
        );
        const quantity = collectOrderPurchaseQuantity(order);
        const item = quantity
          ? marketDepthListingSelection({
              asset,
              depthOrder,
              order,
              quantity,
              profileWallets,
              nowSeconds: Date.now() / 1000,
            })
          : null;
        if (!item) throw new Error("MARKET_DEPTH_UNSUPPORTED");
        if (
          selectedRef.current.length >= MARKET_BATCH_LIMITS.orders ||
          marketDepthSelectionConflict(selectedRef.current, item)
        )
          throw new Error("MARKET_DEPTH_OVERLAP");
        setSelected([...selectedRef.current, item]);
      });
    },
    [profileWallets, resolveOrder, runForRow, setSelected]
  );

  const updateQuantity = useCallback(
    (depthOrder: ApiMarketOrder, quantity: string) => {
      if (reviewBusyRef.current) return;
      setSelected(
        selectedRef.current.map((item) =>
          rowMatches(item, depthOrder) ? { ...item, quantity } : item
        )
      );
    },
    [setSelected]
  );

  const acceptOffer = useCallback(
    (depthOrder: ApiMarketOrder, trigger: HTMLButtonElement) => {
      invalidateAcceptAttempt();
      const controller = new AbortController();
      const generation = acceptGeneration.current;
      acceptAttempt.current = {
        controller,
        generation,
        orderKey: depthOrder.order_key,
      };
      const assertCurrentIntent = () => {
        controller.signal.throwIfAborted();
        if (
          acceptGeneration.current !== generation ||
          acceptAttempt.current?.controller !== controller
        )
          throw new Error("MARKET_DEPTH_CHANGED");
      };
      void runForRow(
        depthOrder,
        async (signal) => {
          assertCurrentIntent();
          if (
            !auth.connectedProfile?.id ||
            !connection.address ||
            auth.isAuthenticated !== true ||
            auth.activeProfileProxy
          )
            throw new Error("MARKET_DEPTH_OWNER_REQUIRED");
          const { asset, order } = await resolveOrder(
            depthOrder,
            ApiMarketTradeOrderSideEnum.Offer,
            signal
          );
          assertCurrentIntent();
          if (
            !marketDepthOfferIsExecutable({
              asset,
              depthOrder,
              order,
              profileWallets,
              nowSeconds: Date.now() / 1000,
            })
          )
            throw new Error("MARKET_DEPTH_UNSUPPORTED");
          const ownership = await fetchCollectAssetOwnership(
            auth.connectedProfile.id,
            asset.asset_key,
            signal
          );
          assertCurrentIntent();
          const maximumQuantity = signerOfferQuantityCap({
            analysis: ownership,
            profileId: auth.connectedProfile.id,
            wallet: connection.address,
            assetKey: asset.asset_key,
            order,
          });
          if (!maximumQuantity) throw new Error("MARKET_DEPTH_OWNER_REQUIRED");
          const quantity = collectOrderPurchaseQuantity(order);
          if (!quantity || BigInt(quantity) > BigInt(maximumQuantity))
            throw new Error("MARKET_DEPTH_UNSUPPORTED");
          assertCurrentIntent();
          setAcceptedOffer({
            asset,
            order,
            quantity,
            maximumQuantity,
            opener: trigger,
          });
        },
        controller
      ).finally(() => {
        if (acceptAttempt.current?.controller === controller)
          acceptAttempt.current = null;
      });
    },
    [
      auth.activeProfileProxy,
      auth.connectedProfile,
      auth.isAuthenticated,
      connection.address,
      invalidateAcceptAttempt,
      profileWallets,
      resolveOrder,
      runForRow,
    ]
  );

  const reviewSelection = useCallback(() => {
    if (selectedRef.current.length === 0 || reviewBusyRef.current) return;
    const controller = new AbortController();
    abortControllers.current.add(controller);
    reviewBusyRef.current = true;
    const generation = selectionGeneration.current;
    const selectedAtStart = selectedRef.current;
    setReviewState({
      busy: true,
      message: t(locale, "marketDepth.trade.checkingSelection"),
    });
    void (async () => {
      try {
        const refreshed: MarketDepthListingSelection[] = [];
        for (const selectedItem of selectedAtStart) {
          const { asset, order } = await resolveOrder(
            selectedItem.depthOrder,
            ApiMarketTradeOrderSideEnum.Listing,
            controller.signal
          );
          const item = marketDepthListingSelection({
            asset,
            depthOrder: selectedItem.depthOrder,
            order,
            quantity: selectedItem.quantity,
            profileWallets,
            nowSeconds: Date.now() / 1000,
          });
          if (!item || marketDepthSelectionConflict(refreshed, item))
            throw new Error("MARKET_DEPTH_CHANGED");
          refreshed.push(item);
        }
        controller.signal.throwIfAborted();
        if (selectionGeneration.current !== generation)
          throw new Error("MARKET_DEPTH_SELECTION_CHANGED");
        setSelected(refreshed);
        setReviewItems(
          refreshed.map(({ asset, order, quantity }) => ({
            asset,
            order,
            quantity,
          }))
        );
        setReviewState({ busy: false });
      } catch {
        if (!controller.signal.aborted)
          setReviewState({
            busy: false,
            error: true,
            message: t(locale, "marketDepth.trade.selectionChanged"),
          });
      } finally {
        reviewBusyRef.current = false;
        abortControllers.current.delete(controller);
      }
    })();
  }, [locale, profileWallets, resolveOrder, setSelected]);

  const value = useMemo<TradeContextValue>(
    () => ({
      selected,
      rowStates,
      selectionBusy: reviewState.busy,
      toggleListing,
      updateQuantity,
      acceptOffer,
      connectOwnerWallet: connection.seizeConnect,
    }),
    [
      acceptOffer,
      connection.seizeConnect,
      rowStates,
      reviewState.busy,
      selected,
      toggleListing,
      updateQuantity,
    ]
  );
  const selectionValid = selected.every((item) =>
    marketDepthListingQuantityIsValid(item.asset, item.order, item.quantity)
  );
  const restoreFocus = (trigger: HTMLButtonElement | null) => {
    queueMicrotask(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  };

  return (
    <TradeContext.Provider value={value}>
      {children}
      <NftPurchasingGate>
        {selected.length > 0 && (
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
            <button
              type="button"
              className={ACTION_CLASS}
              disabled={!selectionValid || reviewState.busy}
              onClick={(event) => {
                reviewOpener.current = event.currentTarget;
                reviewSelection();
              }}
            >
              {t(locale, "marketDepth.trade.review", {
                count: formatNumber(locale, selected.length),
              })}
            </button>
            {reviewState.message && (
              <p
                role={reviewState.error ? "alert" : "status"}
                className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
              >
                {reviewState.message}
              </p>
            )}
          </div>
        )}
        {reviewItems && (
          <Suspense fallback={<TradeLoading locale={locale} />}>
            <CollectBatchController
              key={reviewItems
                .map((item) => item.order.identity.order_hash.toLowerCase())
                .join(":")}
              items={reviewItems}
              onClose={() => {
                setReviewItems(null);
                restoreFocus(reviewOpener.current);
              }}
              onMarketChange={() => {
                setReviewItems(null);
                setSelected([]);
                onMarketChange();
              }}
            />
          </Suspense>
        )}
        {acceptedOffer && (
          <Suspense fallback={<TradeLoading locale={locale} />}>
            <CollectTradeController
              key={`${acceptedOffer.order.identity.protocol_address.toLowerCase()}:${acceptedOffer.order.identity.order_hash.toLowerCase()}`}
              asset={acceptedOffer.asset}
              action="accept"
              initialOrder={acceptedOffer.order}
              initialQuantity={acceptedOffer.quantity}
              maximumOrderQuantity={acceptedOffer.maximumQuantity}
              fixedOrder
              onClose={() => {
                const opener = acceptedOffer.opener;
                invalidateAcceptAttempt();
                setAcceptedOffer(null);
                restoreFocus(opener);
              }}
              onMarketChange={() => {
                invalidateAcceptAttempt();
                setAcceptedOffer(null);
                onMarketChange();
              }}
            />
          </Suspense>
        )}
      </NftPurchasingGate>
    </TradeContext.Provider>
  );
}

export function MarketDepthOrderAction({
  order,
  locale,
}: {
  readonly order: ApiMarketOrder;
  readonly locale: SupportedLocale;
}) {
  const quantityErrorId = useId();
  const context = useContext(TradeContext);
  if (!context) return null;
  const state = context.rowStates[order.order_key];
  const selected = context.selected.find((item) => rowMatches(item, order));
  const criteriaOffer =
    order.side === ApiMarketOrderSideEnum.Bid &&
    (order.scope !== ApiMarketOrderScopeEnum.Token ||
      order.applicability !== ApiMarketOrderApplicabilityEnum.Token ||
      order.token_id === null);
  const available = selected
    ? collectOrderAvailableQuantity(selected.order)
    : null;
  const invalidQuantity = Boolean(
    selected &&
    !marketDepthListingQuantityIsValid(
      selected.asset,
      selected.order,
      selected.quantity
    )
  );
  const listingActionKey = selected
    ? "marketDepth.trade.remove"
    : "marketDepth.trade.collect";

  return (
    <NftPurchasingGate>
      <div className="tw-mt-3 tw-space-y-2">
        {criteriaOffer ? (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "marketDepth.trade.criteriaUnavailable")}
          </p>
        ) : (
          <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
            {selected && (
              <label className="tw-grid tw-gap-1 tw-text-xs tw-text-iron-400">
                <span>{t(locale, "marketDepth.trade.quantity")}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={selected.quantity}
                  aria-invalid={invalidQuantity}
                  aria-describedby={
                    invalidQuantity ? quantityErrorId : undefined
                  }
                  disabled={context.selectionBusy}
                  maxLength={78}
                  onChange={(event) =>
                    context.updateQuantity(order, event.currentTarget.value)
                  }
                  className="tw-h-11 tw-w-24 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-sm tw-tabular-nums tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                />
              </label>
            )}
            <button
              type="button"
              className={ACTION_CLASS}
              disabled={Boolean(state?.busy) || context.selectionBusy}
              onClick={(event) =>
                order.side === ApiMarketOrderSideEnum.Ask
                  ? context.toggleListing(order)
                  : context.acceptOffer(order, event.currentTarget)
              }
            >
              {order.side === ApiMarketOrderSideEnum.Ask
                ? t(locale, listingActionKey)
                : t(locale, "marketDepth.trade.accept")}
            </button>
          </div>
        )}
        {selected && available && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-500">
            {t(locale, "marketDepth.trade.available", { quantity: available })}
          </p>
        )}
        {invalidQuantity && (
          <p
            id={quantityErrorId}
            role="alert"
            className="tw-m-0 tw-text-xs tw-text-rose-200"
          >
            {t(locale, "marketDepth.trade.quantityInvalid")}
          </p>
        )}
        {state?.message && (
          <p
            role={state.error ? "alert" : "status"}
            className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {state.message}
          </p>
        )}
        {state?.connectAction && (
          <button
            type="button"
            className={ACTION_CLASS}
            onClick={context.connectOwnerWallet}
          >
            {t(locale, "marketDepth.trade.connectOwner")}
          </button>
        )}
      </div>
    </NftPurchasingGate>
  );
}
