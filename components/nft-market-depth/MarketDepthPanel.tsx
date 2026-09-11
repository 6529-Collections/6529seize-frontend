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
import { commonApiFetch } from "@/services/api/common-api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MarketDepthOrderDetails from "./MarketDepthOrderDetails";
import {
  formatDate,
  formatDecimal,
  formatInteger,
} from "./market-depth-format";

const MARKET_DEPTH_QUERY_KEY = QueryKey.NFT_MARKET_DEPTH;

const PAGE_SIZE = 40;
const MAX_LEVELS = 8;
const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

type MarketDepthStatus = "loading" | "ready" | "error";

interface MarketDepthPanelProps {
  readonly contract: string;
  readonly tokenId: string | number;
  readonly locale?: SupportedLocale | undefined;
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

function statusLabel(
  locale: SupportedLocale,
  status: ApiMarketDepth["status"]
): string {
  switch (status) {
    case ApiMarketDepthStatusEnum.Fresh:
      return t(locale, "marketDepth.status.fresh");
    case ApiMarketDepthStatusEnum.Stale:
      return t(locale, "marketDepth.status.stale");
    case ApiMarketDepthStatusEnum.Unavailable:
      return t(locale, "marketDepth.status.unavailable");
    default:
      return t(locale, "marketDepth.status.unknown");
  }
}

function statusClassName(status: ApiMarketDepth["status"]): string {
  switch (status) {
    case ApiMarketDepthStatusEnum.Fresh:
      return "tw-border-emerald-400/30 tw-bg-emerald-400/10 tw-text-emerald-200";
    case ApiMarketDepthStatusEnum.Stale:
      return "tw-border-amber-400/30 tw-bg-amber-400/10 tw-text-amber-200";
    case ApiMarketDepthStatusEnum.Unavailable:
      return "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300";
    default:
      return "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300";
  }
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

function LevelTable({
  side,
  levels,
  currency,
  locale,
}: {
  readonly side: "ask" | "bid";
  readonly levels: readonly ApiMarketDepthLevel[];
  readonly currency: string;
  readonly locale: SupportedLocale;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleLevels = showAll ? levels : levels.slice(0, MAX_LEVELS);
  const label =
    side === "ask"
      ? t(locale, "marketDepth.asks")
      : t(locale, "marketDepth.bids");

  return (
    <div className="tw-min-w-0">
      {visibleLevels.length === 0 ? (
        <p className="tw-m-0 tw-rounded-lg tw-bg-black/20 tw-p-3 tw-text-sm tw-text-iron-500">
          {t(locale, "marketDepth.noLevels")}
        </p>
      ) : (
        <div className="tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5">
          <table className="tw-w-full tw-table-fixed tw-border-collapse tw-text-right tw-text-xs sm:tw-text-sm">
            <caption className="tw-sr-only">
              {t(locale, "marketDepth.table.ariaLabel", {
                side: label,
                currency,
              })}
            </caption>
            <thead className="tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/20 tw-text-xs tw-font-medium tw-text-iron-500">
              <tr>
                <th
                  scope="col"
                  className="tw-w-[42%] tw-px-1 tw-py-2 tw-text-left sm:tw-px-3"
                >
                  {t(locale, "marketDepth.table.price")}
                </th>
                <th
                  scope="col"
                  aria-label={t(locale, "marketDepth.table.quantity")}
                  className="tw-w-[29%] tw-px-1 tw-py-2 sm:tw-px-3"
                >
                  {t(locale, "marketDepth.table.quantityShort")}
                </th>
                <th
                  scope="col"
                  aria-label={t(locale, "marketDepth.table.cumulative")}
                  className="tw-w-[29%] tw-px-1 tw-py-2 sm:tw-px-3"
                >
                  {t(locale, "marketDepth.table.cumulativeShort")}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleLevels.map((level, index) => (
                <tr
                  key={`${side}-${level.unit_price}-${index}`}
                  className="tw-border-b tw-border-solid tw-border-white/5 last:tw-border-b-0"
                >
                  <td
                    className="tw-break-words tw-px-1 tw-py-2 tw-text-left tw-font-medium tw-text-white sm:tw-px-3"
                    title={level.unit_price}
                  >
                    {formatDecimal(locale, level.unit_price)}
                  </td>
                  <td className="tw-break-words tw-px-1 tw-py-2 tw-text-iron-200 sm:tw-px-3">
                    {formatInteger(locale, level.quantity)}
                  </td>
                  <td className="tw-break-words tw-px-1 tw-py-2 tw-text-iron-400 sm:tw-px-3">
                    {formatInteger(locale, level.cumulative_quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {levels.length > MAX_LEVELS && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="tw-mt-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {showAll
            ? t(locale, "marketDepth.levels.showFewer")
            : t(locale, "marketDepth.levels.showAll")}
        </button>
      )}
    </div>
  );
}

interface NonEmptyDepthSide {
  readonly book: ApiMarketCurrencyBook;
  readonly side: "ask" | "bid";
  readonly levels: readonly ApiMarketDepthLevel[];
}

function MarketDepthSkeleton() {
  return (
    <div aria-hidden="true" className="tw-grid tw-gap-4 md:tw-grid-cols-2">
      {["one", "two"].map((key) => (
        <div
          key={key}
          className="tw-h-28 tw-animate-pulse tw-rounded-lg tw-bg-white/5 motion-reduce:tw-animate-none"
        />
      ))}
    </div>
  );
}

export default function MarketDepthPanel({
  contract,
  tokenId,
  locale,
}: MarketDepthPanelProps) {
  const browserLocale = useBrowserLocale();
  const resolvedLocale = locale ?? browserLocale;
  const [state, setState] = useState<MarketDepthState>(INITIAL_STATE);
  const [retryVersion, setRetryVersion] = useState(0);
  const [loadingMoreKey, setLoadingMoreKey] = useState<string | null>(null);
  const [loadMoreErrorKey, setLoadMoreErrorKey] = useState<string | null>(null);
  const loadMoreAbortControllerRef = useRef<AbortController | null>(null);
  const queryKey = useMemo(
    () => [MARKET_DEPTH_QUERY_KEY, contract, String(tokenId)] as const,
    [contract, tokenId]
  );
  const requestKey = `${queryKey.join("/")}/${retryVersion}`;

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

  const loadMore = useCallback(async () => {
    if (!data?.next || isLoadingMore) {
      return;
    }

    setLoadMoreErrorKey(null);
    const capturedRequestKey = requestKey;
    const abortController = new AbortController();
    loadMoreAbortControllerRef.current = abortController;
    setLoadingMoreKey(capturedRequestKey);
    try {
      const nextPage = await loadDepth(data.next, abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }
      setState((current) => {
        if (!current.data || current.requestKey !== capturedRequestKey) {
          return current;
        }
        const existingKeys = new Set(
          current.data.orders.map((order) => order.order_key)
        );
        const newOrders = nextPage.orders.filter(
          (order) => !existingKeys.has(order.order_key)
        );
        return {
          status: "ready",
          requestKey: capturedRequestKey,
          data: {
            ...current.data,
            orders: [...current.data.orders, ...newOrders],
            next: nextPage.next,
          },
        };
      });
    } catch {
      if (!abortController.signal.aborted) {
        setLoadMoreErrorKey(capturedRequestKey);
      }
    } finally {
      if (loadMoreAbortControllerRef.current === abortController) {
        loadMoreAbortControllerRef.current = null;
        setLoadingMoreKey(null);
      }
    }
  }, [data, isLoadingMore, loadDepth, requestKey]);

  const ethBook = data
    ? getBookByAddress(data.books, NATIVE_ETH_ADDRESS)
    : undefined;
  const wethBook = data
    ? getBookByAddress(data.books, WETH_ADDRESS)
    : undefined;
  const formattedAsOf = data ? formatDate(data.as_of, resolvedLocale) : null;
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
      className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 before:tw-content-none after:tw-content-none sm:tw-p-5 [&_*]:before:tw-content-none [&_*]:after:tw-content-none"
    >
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
        <div>
          <h2
            id="market-depth-heading"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-tracking-tight tw-text-white"
          >
            {t(resolvedLocale, "marketDepth.title")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-max-w-2xl tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(resolvedLocale, "marketDepth.description")}
          </p>
          {formattedAsOf && (
            <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
              {t(resolvedLocale, "marketDepth.capturedAt", {
                time: formattedAsOf,
              })}
            </p>
          )}
        </div>
        {data && (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
            <span
              className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${statusClassName(data.status)}`}
            >
              {statusLabel(resolvedLocale, data.status)}
            </span>
            <button
              type="button"
              onClick={() => setRetryVersion((version) => version + 1)}
              className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <ArrowPathIcon aria-hidden="true" className="tw-h-3.5 tw-w-3.5" />
              {t(resolvedLocale, "marketDepth.refresh")}
            </button>
          </div>
        )}
      </div>

      {effectiveStatus === "loading" && (
        <div className="tw-mt-5">
          <p className="tw-sr-only" role="status">
            {t(resolvedLocale, "marketDepth.loading")}
          </p>
          <MarketDepthSkeleton />
        </div>
      )}

      {effectiveStatus === "error" && (
        <div className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-rose-400/20 tw-bg-rose-400/5 tw-p-4">
          <p role="alert" className="tw-m-0 tw-text-sm tw-text-rose-200">
            {t(resolvedLocale, "marketDepth.error")}
          </p>
          <button
            type="button"
            onClick={() => setRetryVersion((version) => version + 1)}
            className="tw-mt-3 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-rose-300/30 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-rose-100 tw-transition hover:tw-bg-rose-300/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <ArrowPathIcon aria-hidden="true" className="tw-h-4 tw-w-4" />
            {t(resolvedLocale, "marketDepth.retry")}
          </button>
        </div>
      )}

      {effectiveStatus === "ready" && data && (
        <div className="tw-mt-5">
          {data.status === ApiMarketDepthStatusEnum.Unavailable ? (
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black/20 tw-p-4">
              <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
                {t(resolvedLocale, "marketDepth.unavailable.title")}
              </p>
              {data.notes.length > 0 && (
                <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-5 tw-text-sm tw-text-iron-400">
                  {data.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2">
                <div className="tw-rounded-lg tw-border tw-border-solid tw-border-emerald-400/15 tw-bg-emerald-400/5 tw-p-4">
                  <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-emerald-200/70">
                    {t(resolvedLocale, "marketDepth.bestAsk")}
                  </div>
                  <div className="tw-mt-1 tw-text-2xl tw-font-semibold tw-text-emerald-100">
                    <DecimalValue
                      locale={resolvedLocale}
                      value={ethBook?.best_ask}
                    />
                  </div>
                </div>
                <div className="tw-rounded-lg tw-border tw-border-solid tw-border-sky-400/15 tw-bg-sky-400/5 tw-p-4">
                  <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-sky-200/70">
                    {t(resolvedLocale, "marketDepth.bestBid")}
                  </div>
                  <div className="tw-mt-1 tw-text-2xl tw-font-semibold tw-text-sky-100">
                    <DecimalValue
                      locale={resolvedLocale}
                      value={wethBook?.best_bid}
                    />
                  </div>
                </div>
              </div>

              {data.status === ApiMarketDepthStatusEnum.Stale && (
                <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-amber-200">
                  {t(resolvedLocale, "marketDepth.stale", {
                    time:
                      formattedAsOf ??
                      t(resolvedLocale, "marketDepth.staleUnknownTime"),
                  })}
                </p>
              )}

              {!hasQuotedLevels && (
                <p className="tw-mb-0 tw-mt-4 tw-rounded-lg tw-bg-black/20 tw-p-3 tw-text-sm tw-text-iron-400">
                  {t(resolvedLocale, "marketDepth.empty")}
                </p>
              )}

              {nonEmptySides.length > 0 && (
                <div className="tw-mt-5 tw-grid tw-grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] tw-gap-4">
                  {nonEmptySides.map(({ book, side, levels }) => (
                    <div
                      key={`${book.currency.address}-${side}`}
                      className="tw-min-w-0 tw-rounded-lg tw-bg-black/5 tw-p-1 sm:tw-p-2"
                    >
                      <div className="tw-mb-3 tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-3 tw-gap-y-1">
                        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
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
                            className="tw-w-full tw-break-all tw-text-[10px] tw-text-iron-500"
                          >
                            {book.currency.address}
                          </span>
                        )}
                      </div>
                      <LevelTable
                        side={side}
                        levels={levels}
                        currency={currencyName(resolvedLocale, book)}
                        locale={resolvedLocale}
                      />
                    </div>
                  ))}
                </div>
              )}

              <MarketDepthOrderDetails
                data={data}
                locale={resolvedLocale}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
                loadMoreError={currentLoadMoreError}
              />

              {(data.criteria_order_count > 0 || data.notes.length > 0) && (
                <div className="tw-mt-4 tw-border-t tw-border-solid tw-border-white/10 tw-pt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
                  {data.criteria_order_count > 0 && (
                    <p className="tw-m-0">
                      {t(
                        resolvedLocale,
                        data.criteria_order_count === 1
                          ? "marketDepth.criteriaSummary.single"
                          : "marketDepth.criteriaSummary",
                        { count: data.criteria_order_count }
                      )}
                    </p>
                  )}
                  {data.notes.length > 0 && (
                    <details className="tw-mt-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-px-3 tw-py-2">
                      <summary className="tw-cursor-pointer tw-font-semibold tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                        {t(resolvedLocale, "marketDepth.details")}
                      </summary>
                      <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-4">
                        {data.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
