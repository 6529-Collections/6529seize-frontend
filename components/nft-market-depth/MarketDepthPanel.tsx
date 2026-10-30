"use client";

import type { ApiMarketCurrencyBook } from "@/generated/models/ApiMarketCurrencyBook";
import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import { ApiMarketDepthStatusEnum } from "@/generated/models/ApiMarketDepth";
import type { ApiMarketDepthLevel } from "@/generated/models/ApiMarketDepthLevel";
import type { SupportedLocale } from "@/i18n/locales";
import { formatInteger as formatLocalizedInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useAutomaticMarketRefresh } from "@/components/collect/useAutomaticMarketRefresh";
import { useAuth } from "@/components/auth/Auth";
import { useConfirmedMarketPurchases } from "@/components/collect/market-activity-store";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MarketDepthOtherOrders } from "./MarketDepthOrderDetails";
import MarketDepthSnapshot from "./MarketDepthSnapshot";
import AboutPrices from "./MarketDepthAboutPrices";
import MarketDepthPriceLevels from "./MarketDepthPriceLevels";
import { MarketDepthTradeProvider } from "./MarketDepthTradeActions";
import {
  loadCompleteMarketDepth,
  MarketDepthSnapshotChangedError,
} from "./market-depth-orders";
import { formatDecimal } from "./market-depth-format";
import { subscribeMarketDepthDisclosure } from "./market-depth-disclosure";
import { reconcileMarketDepthPurchases } from "./market-depth-purchases";

const MARKET_DEPTH_QUERY_KEY = QueryKey.NFT_MARKET_DEPTH;

const PAGE_SIZE = 40;

const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

type MarketDepthStatus = "loading" | "ready" | "error";

interface MarketDepthPanelProps {
  readonly contract: string;
  readonly tokenId: string | number;
  readonly locale?: SupportedLocale | undefined;
  readonly refreshKey?: number;
  readonly actions?: ReactNode | ((refresh: () => void) => ReactNode);
  readonly embedded?: boolean;
  readonly active?: boolean;
  readonly onReveal?: () => void;
  readonly focusedOrderHash?: string | null;
}

interface MarketDepthState {
  readonly assetKey: string | null;
  readonly status: MarketDepthStatus;
  readonly data: ApiMarketDepth | null;
  readonly requestKey: string | null;
  readonly backgroundFailed?: boolean;
}

const INITIAL_STATE: MarketDepthState = {
  assetKey: null,
  status: "loading",
  data: null,
  requestKey: null,
};

function currencyName(
  locale: SupportedLocale,
  book: ApiMarketCurrencyBook
): string {
  const symbol = book.currency.symbol.trim();
  return symbol.length > 0 ? symbol : t(locale, "marketDepth.currency.unknown");
}

function getBookByAddress(
  books: readonly ApiMarketCurrencyBook[],
  address: string
): ApiMarketCurrencyBook | undefined {
  return books.find((book) => book.currency.address.toLowerCase() === address);
}

function isCanonicalCurrency(book: ApiMarketCurrencyBook): boolean {
  const address = book.currency.address.toLowerCase();
  return address === NATIVE_ETH_ADDRESS || address === WETH_ADDRESS;
}

function DecimalValue({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: string | null | undefined;
}) {
  const formatted = formatDecimal(locale, value);
  if (formatted !== "—") return formatted;

  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="tw-sr-only">
        {t(locale, "nftActivity.notAvailable")}
      </span>
    </>
  );
}

interface DepthSide {
  readonly book: ApiMarketCurrencyBook | undefined;
  readonly summary?: "marketDepth.bestAsk" | "marketDepth.bestBid";
  readonly side: "ask" | "bid";
  readonly levels: readonly ApiMarketDepthLevel[];
}

function MarketDepthSkeleton() {
  return (
    <div aria-hidden="true" className="tw-grid tw-grid-cols-2 tw-gap-4">
      {["one", "two"].map((key) => (
        <div
          key={key}
          className="tw-h-20 tw-animate-pulse tw-rounded-xl tw-bg-white/[0.025] motion-reduce:tw-animate-none"
        />
      ))}
    </div>
  );
}

export default function MarketDepthPanel({
  contract,
  tokenId,
  locale,
  actions,
  refreshKey = 0,
  embedded = false,
  active = true,
  onReveal,
  focusedOrderHash,
}: MarketDepthPanelProps) {
  const browserLocale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const purchases = useConfirmedMarketPurchases(connectedProfile?.id);
  const resolvedLocale = locale ?? browserLocale;
  const id = useId();
  const heading = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const assetKey = `${contract.toLowerCase()}:${String(tokenId)}`;
  const requestedOrderHash = /^0x[\da-f]{64}$/i.test(focusedOrderHash ?? "")
    ? (focusedOrderHash?.toLowerCase() ?? null)
    : null;
  const orderFocusKey = `${assetKey}:${requestedOrderHash ?? ""}`;
  const [completedOrderFocus, setCompletedOrderFocus] = useState<string | null>(
    null
  );
  const finishOrderFocus = useCallback(() => {
    setCompletedOrderFocus(orderFocusKey);
  }, [orderFocusKey]);
  const [disclosure, setDisclosure] = useState({
    assetKey,
    open: false,
    reveal: false,
  });
  const focusedDisclosure = useRef<typeof disclosure | null>(null);
  const open =
    embedded || (disclosure.assetKey === assetKey && disclosure.open);
  const pendingOrderFocus =
    active && open && completedOrderFocus !== orderFocusKey
      ? requestedOrderHash
      : null;
  useEffect(
    () =>
      subscribeMarketDepthDisclosure(contract, tokenId, () => {
        onReveal?.();
        setDisclosure({ assetKey, open: true, reveal: true });
      }),
    [assetKey, contract, tokenId, onReveal]
  );
  useLayoutEffect(() => {
    if (
      !active ||
      !open ||
      !disclosure.reveal ||
      focusedDisclosure.current === disclosure
    )
      return;
    focusedDisclosure.current = disclosure;
    const target = embedded ? panel.current : heading.current;
    target?.focus({ preventScroll: true });
    const scrollTarget = embedded
      ? (target?.closest<HTMLElement>("[data-nft-detail-tab-section]") ??
        target)
      : target;
    scrollTarget?.scrollIntoView({
      block: "start",
      behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "instant"
        : "smooth",
    });
  }, [active, embedded, open, disclosure]);
  const [state, setState] = useState<MarketDepthState>(INITIAL_STATE);
  const [retryVersion, setRetryVersion] = useState(0);
  const interaction = useRef({ busy: false, generation: 0 });
  const onInteractionChange = useCallback((busy: boolean) => {
    interaction.current = {
      busy,
      generation: interaction.current.generation + 1,
    };
  }, []);
  const refresh = useCallback(() => {
    setRetryVersion((version) => version + 1);
  }, []);
  const renderedActions =
    typeof actions === "function" ? actions(refresh) : actions;
  const [loadingMoreKey, setLoadingMoreKey] = useState<string | null>(null);
  const [loadMoreErrorKey, setLoadMoreErrorKey] = useState<string | null>(null);
  const loadMoreAbortControllerRef = useRef<AbortController | null>(null);
  const browsingRequest = useRef<AbortSignal | null>(null);
  const queryKey = useMemo(
    () => [MARKET_DEPTH_QUERY_KEY, contract, String(tokenId)] as const,
    [contract, tokenId]
  );
  const requestKey = `${queryKey.join("/")}/${retryVersion}/${refreshKey}`;

  const loadDepth = useCallback(
    async (cursor?: string, signal?: AbortSignal) => {
      const params: Record<string, string> = {
        page_size: String(PAGE_SIZE),
      };
      if (cursor) {
        params["cursor"] = cursor;
      }

      return commonApiFetch<ApiMarketDepth>({
        endpoint: `market-depth/${encodeURIComponent(contract)}/${encodeURIComponent(String(tokenId))}`,
        params,
        signal,
        includeWalletAuth: false,
        errorMode: "structured",
      });
    },
    [contract, tokenId]
  );

  const rawData = state.assetKey === assetKey ? state.data : null;
  const data = useMemo(
    () => (rawData ? reconcileMarketDepthPurchases(rawData, purchases) : null),
    [rawData, purchases]
  );
  const backgroundFailed =
    state.requestKey === requestKey && state.backgroundFailed === true;
  let effectiveStatus: MarketDepthStatus =
    state.requestKey === requestKey ? state.status : "loading";
  if (data) effectiveStatus = "ready";
  const isLoadingMore =
    loadingMoreKey === requestKey ||
    Boolean(rawData && state.requestKey !== requestKey);
  const currentLoadMoreError =
    loadMoreErrorKey === requestKey
      ? t(resolvedLocale, "marketDepth.moreError")
      : null;

  useEffect(() => {
    const abortController = new AbortController();
    const isCurrent = () => !abortController.signal.aborted;
    void (async () => {
      try {
        const loadedData = await loadDepth(undefined, abortController.signal);
        if (!isCurrent()) return;
        setState({
          assetKey,
          status: "ready",
          data: loadedData,
          requestKey,
        });
        if (requestedOrderHash && loadedData.next) {
          setLoadingMoreKey(requestKey);
          try {
            const complete = await loadCompleteMarketDepth(
              loadedData,
              loadDepth,
              abortController.signal
            );
            if (isCurrent()) {
              setState({
                assetKey,
                status: "ready",
                data: complete,
                requestKey,
              });
            }
          } catch {
            if (isCurrent()) setLoadMoreErrorKey(requestKey);
          } finally {
            if (isCurrent()) setLoadingMoreKey(null);
          }
        }
      } catch {
        if (!abortController.signal.aborted) {
          setState((current) =>
            current.assetKey === assetKey && current.data
              ? { ...current, requestKey, backgroundFailed: true }
              : { assetKey, status: "error", data: null, requestKey }
          );
        }
      }
    })();

    return () => {
      abortController.abort();
      loadMoreAbortControllerRef.current?.abort();
    };
  }, [assetKey, loadDepth, requestKey, requestedOrderHash]);

  const loadOrders = useCallback(async () => {
    // Opening details takes precedence over a read started before that click.
    interaction.current.generation++;
    if (
      !rawData ||
      state.requestKey !== requestKey ||
      (!rawData.next && loadMoreErrorKey !== requestKey) ||
      (loadMoreAbortControllerRef.current &&
        !loadMoreAbortControllerRef.current.signal.aborted)
    ) {
      return;
    }

    setLoadMoreErrorKey(null);
    const capturedRequestKey = requestKey;
    const abortController = new AbortController();
    loadMoreAbortControllerRef.current = abortController;
    setLoadingMoreKey(capturedRequestKey);
    const publish = (loadedData: ApiMarketDepth) => {
      if (abortController.signal.aborted) return;
      setState((current) =>
        current.requestKey === capturedRequestKey
          ? {
              assetKey,
              status: "ready",
              requestKey: capturedRequestKey,
              data: loadedData,
            }
          : current
      );
    };
    try {
      let completed: ApiMarketDepth;
      try {
        completed = await loadCompleteMarketDepth(
          rawData,
          loadDepth,
          abortController.signal
        );
      } catch (error) {
        if (
          !(error instanceof MarketDepthSnapshotChangedError) ||
          abortController.signal.aborted
        )
          throw error;
        const freshData = await loadDepth(undefined, abortController.signal);
        abortController.signal.throwIfAborted();
        publish(freshData);
        completed = await loadCompleteMarketDepth(
          freshData,
          loadDepth,
          abortController.signal
        );
      }
      publish(completed);
    } catch {
      if (!abortController.signal.aborted)
        setLoadMoreErrorKey(capturedRequestKey);
    } finally {
      if (loadMoreAbortControllerRef.current === abortController) {
        loadMoreAbortControllerRef.current = null;
        setLoadingMoreKey(null);
      }
    }
  }, [
    assetKey,
    rawData,
    loadDepth,
    loadMoreErrorKey,
    requestKey,
    state.requestKey,
  ]);
  const updateBrowsingDepth = useCallback(
    async (signal: AbortSignal) => {
      const generation = interaction.current.generation;
      const canPublish = () =>
        !signal.aborted &&
        !interaction.current.busy &&
        interaction.current.generation === generation &&
        !panel.current?.querySelector(
          '[data-market-depth-order-details="true"], details[open]'
        ) &&
        !loadMoreAbortControllerRef.current;
      if (!canPublish() || browsingRequest.current?.aborted === false) return;
      browsingRequest.current = signal;
      try {
        const next = await loadDepth(undefined, signal);
        setState((current) =>
          canPublish() && current.requestKey === requestKey
            ? { ...current, data: next, backgroundFailed: false }
            : current
        );
      } catch {
        // Keep the last observed book and its mounted trade state on failure.
        setState((current) =>
          canPublish() && current.requestKey === requestKey
            ? { ...current, backgroundFailed: true }
            : current
        );
      } finally {
        if (browsingRequest.current === signal) browsingRequest.current = null;
      }
    },
    [loadDepth, requestKey]
  );
  useAutomaticMarketRefresh(
    active && open && data !== null && !isLoadingMore,
    updateBrowsingDepth
  );
  const ethBook = data
    ? getBookByAddress(data.books, NATIVE_ETH_ADDRESS)
    : undefined;
  const wethBook = data
    ? getBookByAddress(data.books, WETH_ADDRESS)
    : undefined;
  const hasQuotedLevels = Boolean(
    data?.books.some((book) => book.asks.length > 0 || book.bids.length > 0)
  );
  const nonEmptySides: readonly DepthSide[] = data
    ? data.books.flatMap((book): DepthSide[] => {
        const sides: DepthSide[] = [];
        if (book.asks.length > 0) {
          sides.push({ book, side: "ask", levels: book.asks });
        }
        if (book.bids.length > 0) {
          sides.push({ book, side: "bid", levels: book.bids });
        }
        return sides;
      })
    : [];

  // Keep both canonical summaries, including an empty side, and retain every
  // other currency/side in its existing relative order below them.
  const displayedSides: readonly DepthSide[] = [
    {
      book: ethBook,
      side: "ask",
      levels: ethBook?.asks ?? [],
      summary: "marketDepth.bestAsk",
    },
    {
      book: wethBook,
      side: "bid",
      levels: wethBook?.bids ?? [],
      summary: "marketDepth.bestBid",
    },
    ...nonEmptySides.filter(
      ({ book, side }) =>
        !(book === ethBook && side === "ask") &&
        !(book === wethBook && side === "bid")
    ),
  ];
  const hasSingleTable = nonEmptySides.length === 1;
  const sideLayoutClassName = hasSingleTable
    ? "tw-contents"
    : "tw-contents lg:tw-flex";
  const controlledDetails =
    data && data.status !== ApiMarketDepthStatusEnum.Unavailable
      ? [
          ...displayedSides.map((_, index) => `${id}-side-${index}`),
          `${id}-details`,
          `${id}-notice`,
        ].join(" ")
      : `${id}-details`;

  return (
    <section
      ref={panel}
      hidden={!active}
      tabIndex={embedded ? -1 : undefined}
      aria-labelledby={`${id}-heading`}
      aria-busy={effectiveStatus === "loading"}
      className={`${embedded ? "tw-outline-none" : "tw-mt-8"} tw-min-w-0 tw-border-0 tw-pt-2 tw-text-sm tw-leading-5 before:tw-content-none after:tw-content-none [&_*]:before:tw-content-none [&_*]:after:tw-content-none`}
    >
      <div className="tw-mb-8 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-4 tw-gap-y-2">
        <div className="tw-min-w-0 tw-flex-1">
          <h2
            id={`${id}-heading`}
            className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200"
          >
            {embedded ? (
              <span className="tw-sr-only">
                {t(resolvedLocale, "marketDepth.disclosure")}
              </span>
            ) : (
              <button
                ref={heading}
                type="button"
                aria-expanded={open}
                aria-controls={controlledDetails}
                onClick={(event) => {
                  event.currentTarget.focus({ preventScroll: true });
                  setDisclosure({ assetKey, open: !open, reveal: false });
                }}
                className="tw-font-inherit tw-flex tw-min-h-11 tw-w-full tw-scroll-mt-24 tw-items-center tw-justify-between tw-gap-5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-left tw-text-inherit hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                <span>{t(resolvedLocale, "marketDepth.disclosure")}</span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${open ? "tw-rotate-180" : ""}`}
                />
              </button>
            )}
          </h2>
          <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1 tw-gap-y-0.5">
            <p
              hidden={!open}
              className="tw-m-0 tw-text-meta tw-leading-5 tw-text-iron-400"
            >
              {t(resolvedLocale, "marketDepth.description")}
            </p>
            {data && (
              <MarketDepthSnapshot data={data} locale={resolvedLocale} />
            )}
          </div>
        </div>
      </div>

      {Boolean(renderedActions) && (
        <div className="tw-mt-5">{renderedActions}</div>
      )}

      {effectiveStatus === "loading" && (
        <div className="tw-mt-5">
          <p className="tw-sr-only" role="status">
            {t(resolvedLocale, "marketDepth.loading")}
          </p>
          <MarketDepthSkeleton />
        </div>
      )}

      {(effectiveStatus === "error" || backgroundFailed) && (
        <div className="tw-mt-5 tw-rounded-xl tw-bg-white/[0.025] tw-px-5 tw-py-5">
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-200">
            {t(resolvedLocale, "marketDepth.error")}
          </p>
          <button
            type="button"
            onClick={() => {
              if (data) void updateBrowsingDepth(new AbortController().signal);
              else refresh();
            }}
            className="tw-font-inherit tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-2 tw-text-meta tw-font-medium tw-text-iron-200 tw-transition-colors hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <ArrowPathIcon aria-hidden="true" className="tw-h-4 tw-w-4" />
            {t(resolvedLocale, "marketDepth.retry")}
          </button>
        </div>
      )}

      {effectiveStatus === "ready" && data && (
        <MarketDepthTradeProvider
          contract={contract}
          tokenId={String(tokenId)}
          locale={resolvedLocale}
          onMarketChange={refresh}
          onInteractionChange={onInteractionChange}
        >
          <div className="tw-flex tw-flex-col">
            {data.status === ApiMarketDepthStatusEnum.Unavailable ? (
              <>
                <div className="tw-rounded-xl tw-bg-white/[0.025] tw-px-5 tw-py-5">
                  <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                    {t(resolvedLocale, "marketDepth.unavailable.title")}
                  </p>
                </div>
                <div id={`${id}-details`} hidden={!open} className="tw-mt-10">
                  <AboutPrices data={data} locale={resolvedLocale} />
                </div>
              </>
            ) : (
              <>
                <div id={`${id}-notice`} hidden={!open}>
                  {requestedOrderHash &&
                    !data.next &&
                    !isLoadingMore &&
                    !currentLoadMoreError &&
                    !data.orders.some(
                      (order) =>
                        order.order_id.toLowerCase() === requestedOrderHash
                    ) && (
                      <p
                        role="status"
                        className="tw-mb-0 tw-mt-5 tw-text-meta tw-leading-5 tw-text-iron-400"
                      >
                        {t(
                          resolvedLocale,
                          "marketDepth.orders.requestedNotShown"
                        )}{" "}
                        <Link
                          href="/collect/orders"
                          className="hover:tw-text-primary-200 tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                        >
                          {t(resolvedLocale, "collect.receipt.viewOrders")}
                        </Link>
                      </p>
                    )}
                </div>
                <div
                  className={`tw-grid tw-grid-cols-2 tw-items-start tw-gap-x-4 tw-gap-y-6 lg:tw-gap-x-12 ${hasSingleTable ? "lg:tw-gap-y-0" : "lg:tw-gap-y-10"}`}
                >
                  {displayedSides.map(
                    ({ book, side, levels, summary }, index) => {
                      const value =
                        side === "ask" ? book?.best_ask : book?.best_bid;
                      const orderCount =
                        book && levels.length > 0 ? (
                          <span className="tw-text-xs tw-tabular-nums tw-leading-[18px] tw-text-iron-500">
                            {t(resolvedLocale, "marketDepth.sideCount.orders", {
                              count: formatLocalizedInteger(
                                resolvedLocale,
                                side === "ask"
                                  ? book.ask_order_count
                                  : book.bid_order_count
                              ),
                            })}
                          </span>
                        ) : null;
                      return (
                        <div
                          key={
                            summary ??
                            `${book?.currency.address ?? "empty"}-${side}`
                          }
                          hidden={!summary && !open}
                          className={`${!summary && !open ? "tw-hidden" : sideLayoutClassName} tw-min-w-0 tw-flex-col`}
                        >
                          {summary && (
                            <div className="tw-order-first tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-justify-between tw-gap-1 lg:tw-flex-row lg:tw-gap-4 lg:tw-pb-4">
                              <dl className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
                                <dt className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-500">
                                  {t(resolvedLocale, summary)}
                                </dt>
                                <dd
                                  className={`tw-m-0 tw-text-sm tw-font-medium tw-tabular-nums tw-tracking-[-0.01em] [overflow-wrap:anywhere] sm:tw-text-base ${value ? "tw-text-iron-50" : "tw-text-iron-600"}`}
                                >
                                  <DecimalValue
                                    locale={resolvedLocale}
                                    value={value}
                                  />
                                </dd>
                              </dl>
                              <span hidden={!open} className="tw-shrink-0">
                                {orderCount}
                              </span>
                            </div>
                          )}
                          <div
                            id={`${id}-side-${index}`}
                            hidden={!open}
                            className="tw-col-span-2 tw-min-w-0 [overflow-anchor:none] empty:tw-hidden"
                          >
                            {book && levels.length > 0 && (
                              <>
                                <div
                                  className={
                                    summary
                                      ? "tw-pb-2 lg:tw-pb-0"
                                      : "tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-3 tw-gap-y-1 tw-pb-2"
                                  }
                                >
                                  <h3
                                    className={
                                      summary
                                        ? "tw-m-0 tw-min-w-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-200 lg:tw-sr-only"
                                        : "tw-m-0 tw-min-w-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-200"
                                    }
                                  >
                                    {t(
                                      resolvedLocale,
                                      side === "ask"
                                        ? "marketDepth.asks"
                                        : "marketDepth.bids"
                                    )}{" "}
                                    · {currencyName(resolvedLocale, book)}
                                  </h3>
                                  {!summary && orderCount}
                                  {!isCanonicalCurrency(book) && (
                                    <span
                                      title={book.currency.address}
                                      className="tw-w-full tw-break-all tw-text-xs tw-text-iron-500"
                                    >
                                      {book.currency.address}
                                    </span>
                                  )}
                                </div>
                                <MarketDepthPriceLevels
                                  side={side}
                                  levels={levels}
                                  currency={book.currency}
                                  currencyLabel={currencyName(
                                    resolvedLocale,
                                    book
                                  )}
                                  orders={data.orders}
                                  isLoading={
                                    isLoadingMore || data.next !== null
                                  }
                                  error={currentLoadMoreError}
                                  onLoadOrders={loadOrders}
                                  onRefresh={refresh}
                                  locale={resolvedLocale}
                                  focusedOrderHash={pendingOrderFocus}
                                  onOrderFocused={finishOrderFocus}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
                <div
                  id={`${id}-details`}
                  hidden={!open}
                  className="[overflow-anchor:none]"
                >
                  {!hasQuotedLevels && (
                    <p className="tw-m-0 tw-rounded-xl tw-bg-white/[0.025] tw-px-5 tw-py-5 tw-text-sm tw-text-iron-400">
                      {t(resolvedLocale, "marketDepth.empty")}
                    </p>
                  )}

                  <div className="tw-col-span-full tw-mt-7 tw-flex tw-flex-col tw-gap-3">
                    <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-500">
                      {t(resolvedLocale, "marketDepth.sourceCaveat")}
                    </p>

                    <div className="empty:tw-hidden">
                      <MarketDepthOtherOrders
                        data={data}
                        locale={resolvedLocale}
                        onRetry={loadOrders}
                        onRefresh={refresh}
                        isLoading={isLoadingMore || data.next !== null}
                        error={currentLoadMoreError}
                        focusedOrderHash={pendingOrderFocus}
                        onOrderFocused={finishOrderFocus}
                      />
                    </div>
                    <AboutPrices data={data} locale={resolvedLocale} />
                  </div>
                </div>
              </>
            )}
          </div>
        </MarketDepthTradeProvider>
      )}
    </section>
  );
}
