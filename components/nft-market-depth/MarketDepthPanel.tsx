"use client";

import type { ApiMarketCurrencyBook } from "@/generated/models/ApiMarketCurrencyBook";
import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import { ApiMarketDepthStatusEnum } from "@/generated/models/ApiMarketDepth";
import type { ApiMarketDepthLevel } from "@/generated/models/ApiMarketDepthLevel";
import type { SupportedLocale } from "@/i18n/locales";
import {
  formatInteger as formatLocalizedInteger,
  formatRelativeTime,
} from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MarketDepthOtherOrders } from "./MarketDepthOrderDetails";
import MarketDepthPriceLevels from "./MarketDepthPriceLevels";
import { MarketDepthTradeProvider } from "./MarketDepthTradeActions";
import {
  loadCompleteMarketDepth,
  MarketDepthSnapshotChangedError,
} from "./market-depth-orders";
import { formatDate, formatDecimal } from "./market-depth-format";

const MARKET_DEPTH_QUERY_KEY = QueryKey.NFT_MARKET_DEPTH;

const PAGE_SIZE = 40;

const MINUTE_IN_MILLISECONDS = 60_000;
const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

type MarketDepthStatus = "loading" | "ready" | "error";

interface MarketDepthPanelProps {
  readonly contract: string;
  readonly tokenId: string | number;
  readonly locale?: SupportedLocale | undefined;
  readonly refreshKey?: number;
  readonly actions?: ReactNode | ((refresh: () => void) => ReactNode);
}

interface MarketDepthState {
  readonly status: MarketDepthStatus;
  readonly data: ApiMarketDepth | null;
  readonly requestKey: string | null;
}

const INITIAL_STATE: MarketDepthState = {
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

const getMinuteClockSnapshot = () =>
  Math.floor(Date.now() / MINUTE_IN_MILLISECONDS);
const getServerMinuteClockSnapshot = () => null;
const subscribeToMinuteClock = (onStoreChange: () => void) => {
  const intervalId = globalThis.setInterval(
    onStoreChange,
    MINUTE_IN_MILLISECONDS
  );
  return () => globalThis.clearInterval(intervalId);
};

function formatAge(
  locale: SupportedLocale,
  value: Date | string | null,
  minuteClock: number | null
): string | null {
  if (value === null || minuteClock === null) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;

  const difference = timestamp - minuteClock * MINUTE_IN_MILLISECONDS;
  if (difference > 0) return null;
  const absoluteDifference = Math.abs(difference);
  const units = [
    { unit: "year", milliseconds: 365 * 24 * 60 * MINUTE_IN_MILLISECONDS },
    { unit: "month", milliseconds: 30 * 24 * 60 * MINUTE_IN_MILLISECONDS },
    { unit: "day", milliseconds: 24 * 60 * MINUTE_IN_MILLISECONDS },
    { unit: "hour", milliseconds: 60 * MINUTE_IN_MILLISECONDS },
    { unit: "minute", milliseconds: MINUTE_IN_MILLISECONDS },
  ] as const;
  const matchingUnit = units.find(
    ({ milliseconds }) => absoluteDifference >= milliseconds
  );

  if (!matchingUnit) {
    return formatRelativeTime(locale, 0, "second", { numeric: "auto" });
  }
  return formatRelativeTime(
    locale,
    Math.round(difference / matchingUnit.milliseconds),
    matchingUnit.unit,
    { numeric: "auto" }
  );
}

function getUpdatedLabel(
  locale: SupportedLocale,
  age: string | null,
  absoluteTime: string | null
): string {
  if (age) return t(locale, "marketDepth.updated", { time: age });
  if (absoluteTime) {
    return t(locale, "marketDepth.updatedAt", { time: absoluteTime });
  }
  return t(locale, "marketDepth.updatedUnknown");
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

interface NonEmptyDepthSide {
  readonly book: ApiMarketCurrencyBook;
  readonly side: "ask" | "bid";
  readonly levels: readonly ApiMarketDepthLevel[];
}

function MarketDepthSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="tw-grid tw-border-0 tw-border-y tw-border-solid tw-border-white/10 sm:tw-grid-cols-2 sm:tw-divide-x sm:tw-divide-y-0 sm:tw-divide-white/10"
    >
      {["one", "two"].map((key) => (
        <div
          key={key}
          className="tw-h-24 tw-animate-pulse tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-bg-white/[0.02] last:tw-border-b-0 motion-reduce:tw-animate-none sm:tw-border-b-0"
        />
      ))}
    </div>
  );
}

function SnapshotMeta({
  data,
  locale,
  minuteClock,
}: {
  readonly data: ApiMarketDepth;
  readonly locale: SupportedLocale;
  readonly minuteClock: number | null;
}) {
  const absoluteTime = formatDate(data.as_of, locale);
  const age = formatAge(locale, data.as_of, minuteClock);
  const updatedLabel = getUpdatedLabel(locale, age, absoluteTime);

  return (
    <p
      title={absoluteTime ?? undefined}
      className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-500"
    >
      <span>{updatedLabel}</span>
      {data.status === ApiMarketDepthStatusEnum.Stale && (
        <>
          <span aria-hidden="true"> · </span>
          <span>{t(locale, "marketDepth.status.stale")}</span>
        </>
      )}
      {data.status === ApiMarketDepthStatusEnum.Unavailable && (
        <>
          <span aria-hidden="true"> · </span>
          <span>{t(locale, "marketDepth.status.unavailable")}</span>
        </>
      )}
    </p>
  );
}

function AboutPrices({
  data,
  locale,
}: {
  readonly data: ApiMarketDepth;
  readonly locale: SupportedLocale;
}) {
  const hasUnpricedCollectionOrders = data.snapshots.some(
    (snapshot) => snapshot.unsupported_count > 0
  );

  return (
    <details className="tw-group tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-4">
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
        {t(locale, "marketDepth.about.title")}
        <span
          aria-hidden="true"
          className="tw-text-iron-500 tw-transition-transform group-open:tw-rotate-45 motion-reduce:tw-transition-none"
        >
          +
        </span>
      </summary>
      <div className="tw-max-w-3xl tw-pb-2 tw-pt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
        <p className="tw-m-0">{t(locale, "marketDepth.about.description")}</p>
        {hasUnpricedCollectionOrders && (
          <p className="tw-mb-0 tw-mt-2">
            {t(locale, "marketDepth.unpricedOrders")}
          </p>
        )}
        {data.criteria_order_count > 0 && (
          <p className="tw-mb-0 tw-mt-2">
            {t(
              locale,
              data.criteria_order_count === 1
                ? "marketDepth.criteriaSummary.single"
                : "marketDepth.criteriaSummary",
              { count: data.criteria_order_count }
            )}
          </p>
        )}
        {data.notes.length > 0 && (
          <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-4">
            {data.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

export default function MarketDepthPanel({
  contract,
  tokenId,
  locale,
  actions,
  refreshKey = 0,
}: MarketDepthPanelProps) {
  const browserLocale = useBrowserLocale();
  const resolvedLocale = locale ?? browserLocale;
  const minuteClock = useSyncExternalStore(
    subscribeToMinuteClock,
    getMinuteClockSnapshot,
    getServerMinuteClockSnapshot
  );
  const [state, setState] = useState<MarketDepthState>(INITIAL_STATE);
  const [retryVersion, setRetryVersion] = useState(0);
  const refresh = useCallback(() => {
    setRetryVersion((version) => version + 1);
  }, []);
  const renderedActions =
    typeof actions === "function" ? actions(refresh) : actions;
  const [loadingMoreKey, setLoadingMoreKey] = useState<string | null>(null);
  const [loadMoreErrorKey, setLoadMoreErrorKey] = useState<string | null>(null);
  const loadMoreAbortControllerRef = useRef<AbortController | null>(null);
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

  const data = state.requestKey === requestKey ? state.data : null;
  const effectiveStatus: MarketDepthStatus =
    state.requestKey === requestKey ? state.status : "loading";
  const isLoadingMore = loadingMoreKey === requestKey;
  const currentLoadMoreError =
    loadMoreErrorKey === requestKey
      ? t(resolvedLocale, "marketDepth.moreError")
      : null;

  useEffect(() => {
    const abortController = new AbortController();
    void (async () => {
      try {
        const loadedData = await loadDepth(undefined, abortController.signal);
        if (!abortController.signal.aborted) {
          setState({
            status: "ready",
            data: loadedData,
            requestKey,
          });
        }
      } catch {
        if (!abortController.signal.aborted) {
          setState({
            status: "error",
            data: null,
            requestKey,
          });
        }
      }
    })();

    return () => {
      abortController.abort();
      loadMoreAbortControllerRef.current?.abort();
    };
  }, [loadDepth, requestKey]);

  const loadOrders = useCallback(async () => {
    if (
      !data ||
      (!data.next && loadMoreErrorKey !== requestKey) ||
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
          data,
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
  }, [data, loadDepth, loadMoreErrorKey, requestKey]);
  const ethBook = data
    ? getBookByAddress(data.books, NATIVE_ETH_ADDRESS)
    : undefined;
  const wethBook = data
    ? getBookByAddress(data.books, WETH_ADDRESS)
    : undefined;
  const hasQuotedLevels = Boolean(
    data?.books.some((book) => book.asks.length > 0 || book.bids.length > 0)
  );
  const nonEmptySides: readonly NonEmptyDepthSide[] = data
    ? data.books.flatMap((book): NonEmptyDepthSide[] => {
        const sides: NonEmptyDepthSide[] = [];
        if (book.asks.length > 0) {
          sides.push({ book, side: "ask", levels: book.asks });
        }
        if (book.bids.length > 0) {
          sides.push({ book, side: "bid", levels: book.bids });
        }
        return sides;
      })
    : [];

  return (
    <section
      aria-labelledby="market-depth-heading"
      aria-busy={effectiveStatus === "loading"}
      className="tw-mt-8 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-7 before:tw-content-none after:tw-content-none [&_*]:before:tw-content-none [&_*]:after:tw-content-none"
    >
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-6 tw-gap-y-4">
        <div className="tw-max-w-2xl">
          <h2
            id="market-depth-heading"
            className="tw-m-0 tw-text-xl tw-font-medium tw-tracking-tight tw-text-white sm:tw-text-2xl"
          >
            {t(resolvedLocale, "marketDepth.title")}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(resolvedLocale, "marketDepth.description")}
          </p>
          {data && (
            <div className="tw-mt-2">
              <SnapshotMeta
                data={data}
                locale={resolvedLocale}
                minuteClock={minuteClock}
              />
            </div>
          )}
        </div>
        {data && (
          <button
            type="button"
            onClick={refresh}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-sm tw-border-0 tw-bg-transparent tw-px-1 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-400 tw-underline-offset-4 tw-transition hover:tw-text-white hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <ArrowPathIcon aria-hidden="true" className="tw-h-3.5 tw-w-3.5" />
            {t(resolvedLocale, "marketDepth.refresh")}
          </button>
        )}
      </div>

      {Boolean(renderedActions) && (
        <div className="tw-mt-7">{renderedActions}</div>
      )}

      {effectiveStatus === "loading" && (
        <div className="tw-mt-8">
          <p className="tw-sr-only" role="status">
            {t(resolvedLocale, "marketDepth.loading")}
          </p>
          <MarketDepthSkeleton />
        </div>
      )}

      {effectiveStatus === "error" && (
        <div className="tw-mt-8 tw-border-0 tw-border-y tw-border-solid tw-border-white/10 tw-py-5">
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-200">
            {t(resolvedLocale, "marketDepth.error")}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-sm tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-underline-offset-4 tw-transition hover:tw-text-white hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
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
        >
          <div className="tw-mt-8">
            {data.status === ApiMarketDepthStatusEnum.Unavailable ? (
              <>
                <div className="tw-border-0 tw-border-y tw-border-solid tw-border-white/10 tw-py-5">
                  <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                    {t(resolvedLocale, "marketDepth.unavailable.title")}
                  </p>
                </div>
                <AboutPrices data={data} locale={resolvedLocale} />
              </>
            ) : (
              <>
                <dl className="tw-m-0 tw-grid tw-border-0 tw-border-y tw-border-solid tw-border-white/10 sm:tw-grid-cols-2 sm:tw-divide-x sm:tw-divide-y-0 sm:tw-divide-white/10">
                  <div className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-py-5 sm:tw-border-b-0 sm:tw-pr-8">
                    <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(resolvedLocale, "marketDepth.bestAsk")}
                    </dt>
                    <dd className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-medium tw-tabular-nums tw-text-iron-100">
                      <DecimalValue
                        locale={resolvedLocale}
                        value={ethBook?.best_ask}
                      />
                    </dd>
                  </div>
                  <div className="tw-py-5 sm:tw-pl-8">
                    <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(resolvedLocale, "marketDepth.bestBid")}
                    </dt>
                    <dd className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-medium tw-tabular-nums tw-text-iron-100">
                      <DecimalValue
                        locale={resolvedLocale}
                        value={wethBook?.best_bid}
                      />
                    </dd>
                  </div>
                </dl>

                {!hasQuotedLevels && (
                  <p className="tw-mb-0 tw-mt-6 tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-pb-6 tw-text-sm tw-text-iron-400">
                    {t(resolvedLocale, "marketDepth.empty")}
                  </p>
                )}

                {nonEmptySides.length > 0 && (
                  <div className="tw-mt-10 tw-grid tw-grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] tw-gap-x-12 tw-gap-y-10">
                    {nonEmptySides.map(({ book, side, levels }) => (
                      <div
                        key={`${book.currency.address}-${side}`}
                        className="tw-min-w-0"
                      >
                        <div className="tw-mb-3 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-3 tw-gap-y-1">
                          <h3 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-base tw-font-medium tw-text-iron-100">
                            {t(
                              resolvedLocale,
                              side === "ask"
                                ? "marketDepth.asks"
                                : "marketDepth.bids"
                            )}{" "}
                            · {currencyName(resolvedLocale, book)}
                          </h3>
                          <span className="tw-text-xs tw-text-iron-500">
                            {t(resolvedLocale, "marketDepth.sideCount.orders", {
                              count: formatLocalizedInteger(
                                resolvedLocale,
                                side === "ask"
                                  ? book.ask_order_count
                                  : book.bid_order_count
                              ),
                            })}
                          </span>
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
                          currencyLabel={currencyName(resolvedLocale, book)}
                          orders={data.orders}
                          isLoading={isLoadingMore || data.next !== null}
                          error={currentLoadMoreError}
                          onLoadOrders={loadOrders}
                          onRefresh={refresh}
                          locale={resolvedLocale}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <p className="tw-mb-0 tw-mt-8 tw-max-w-3xl tw-text-xs tw-leading-5 tw-text-iron-500">
                  {t(resolvedLocale, "marketDepth.sourceCaveat")}
                </p>

                <MarketDepthOtherOrders
                  data={data}
                  locale={resolvedLocale}
                  onRetry={loadOrders}
                  onRefresh={refresh}
                  isLoading={isLoadingMore || data.next !== null}
                  error={currentLoadMoreError}
                />
                <AboutPrices data={data} locale={resolvedLocale} />
              </>
            )}
          </div>
        </MarketDepthTradeProvider>
      )}
    </section>
  );
}
