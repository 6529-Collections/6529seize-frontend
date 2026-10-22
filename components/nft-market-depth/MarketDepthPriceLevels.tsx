"use client";

import type { ApiMarketCurrency } from "@/generated/models/ApiMarketCurrency";
import type { ApiMarketDepthLevel } from "@/generated/models/ApiMarketDepthLevel";
import type { ApiMarketOrder } from "@/generated/models/ApiMarketOrder";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Fragment, useId, useState } from "react";
import { formatDecimal, formatInteger } from "./market-depth-format";
import { getLevelOrders } from "./market-depth-orders";
import MarketDepthOrderDetails from "./MarketDepthOrderDetails";
import {
  MarketDepthLevelAction,
  MarketDepthOrderFeedback,
  useMarketDepthTradeActionsAvailable,
} from "./MarketDepthOrderAction";

const MAX_LEVELS = 10;

export default function MarketDepthPriceLevels({
  side,
  levels,
  currency,
  currencyLabel,
  locale,
  orders,
  isLoading,
  error,
  onLoadOrders,
  onRefresh,
  focusedOrderHash,
  onOrderFocused,
}: {
  readonly side: "ask" | "bid";
  readonly levels: readonly ApiMarketDepthLevel[];
  readonly currency: ApiMarketCurrency;
  readonly currencyLabel: string;
  readonly locale: SupportedLocale;
  readonly orders: readonly ApiMarketOrder[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onLoadOrders: () => void;
  readonly onRefresh: () => void;
  readonly focusedOrderHash?: string | null;
  readonly onOrderFocused?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [openPrice, setOpenPrice] = useState<string | null>(null);
  const [openedOrderHash, setOpenedOrderHash] = useState<string | null>(null);
  const tradeActionsAvailable = useMarketDepthTradeActionsAvailable();
  const disclosureId = useId();
  const visibleLevels = showAll ? levels : levels.slice(0, MAX_LEVELS);
  const label = t(
    locale,
    side === "ask" ? "marketDepth.asks" : "marketDepth.bids"
  );
  if (
    focusedOrderHash &&
    openedOrderHash !== focusedOrderHash &&
    !isLoading &&
    !error
  ) {
    const index = levels.findIndex((level) =>
      getLevelOrders(orders, currency, side, level.unit_price).some(
        (order) => order.order_id.toLowerCase() === focusedOrderHash
      )
    );
    const level = levels[index];
    if (level) {
      setOpenedOrderHash(focusedOrderHash);
      if (index >= MAX_LEVELS) setShowAll(true);
      setOpenPrice(level.unit_price);
    }
  }

  return (
    <div className="tw-min-w-0 tw-@container">
      <div className="tw-min-w-0">
        <table className="tw-w-full tw-table-fixed tw-border-separate tw-border-spacing-x-0 tw-border-spacing-y-1 tw-text-right tw-text-meta tw-leading-5">
          <caption className="tw-sr-only">
            {t(locale, "marketDepth.table.ariaLabel", {
              side: label,
              currency: currencyLabel,
            })}
          </caption>
          <thead className="tw-text-[11px] tw-uppercase tw-tracking-[0.08em] tw-text-iron-500 [&_th]:tw-h-6 [&_th]:tw-py-0 [&_th]:tw-font-medium">
            <tr>
              <th
                scope="col"
                className={`${tradeActionsAvailable ? "tw-w-[64%]" : "tw-w-full"} tw-pl-4 tw-text-left sm:tw-w-auto sm:tw-pl-5 sm:tw-pr-3`}
              >
                {t(locale, "marketDepth.table.price")}
              </th>
              <th
                scope="col"
                aria-label={t(locale, "marketDepth.table.quantity")}
                className="tw-hidden tw-w-[18%] @2xl:tw-w-[140px] sm:tw-table-cell sm:tw-px-3"
              >
                {t(locale, "marketDepth.table.quantityShort")}
              </th>
              <th
                scope="col"
                aria-label={t(locale, "marketDepth.table.cumulative")}
                className="tw-hidden tw-w-[18%] tw-pr-2.5 @2xl:tw-w-[140px] sm:tw-table-cell sm:tw-pl-3"
              >
                {t(locale, "marketDepth.table.cumulativeShort")}
              </th>
              {tradeActionsAvailable && (
                <th
                  scope="col"
                  className="tw-w-[36%] tw-pr-2.5 @2xl:tw-w-[120px] sm:tw-w-28"
                >
                  <span className="tw-sr-only">
                    {t(locale, "marketDepth.table.action")}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleLevels.map((level) => {
              const cellClass =
                "tw-h-[54px] tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-bg-transparent tw-tabular-nums tw-transition-colors tw-duration-200 group-hover:tw-bg-white/[0.02] motion-reduce:tw-transition-none";
              const open = openPrice === level.unit_price;
              const panelId = disclosureId + "-" + level.unit_price;
              const levelOrders = getLevelOrders(
                orders,
                currency,
                side,
                level.unit_price
              );
              const singleOrder =
                level.order_count === 1 && levelOrders.length === 1 && !error
                  ? levelOrders[0]
                  : undefined;
              const toggleDetails = () => {
                if (focusedOrderHash) onOrderFocused?.();
                setOpenPrice(open ? null : level.unit_price);
                if (!open) onLoadOrders();
              };
              return (
                <Fragment key={level.unit_price}>
                  <tr className="tw-group">
                    <td
                      className={`${cellClass} tw-py-0 tw-pl-4 tw-text-left sm:tw-pl-5 sm:tw-pr-3`}
                    >
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        aria-label={t(
                          locale,
                          side === "ask"
                            ? "marketDepth.levels.askDetails"
                            : "marketDepth.levels.bidDetails",
                          {
                            price: formatDecimal(locale, level.unit_price),
                            currency: currencyLabel,
                          }
                        )}
                        title={level.unit_price}
                        onClick={toggleDetails}
                        className="tw-font-inherit tw-flex tw-min-h-12 tw-w-full tw-items-center tw-justify-start tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-left tw-text-[15px] tw-font-medium tw-tabular-nums tw-text-iron-200 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400"
                      >
                        <span className="tw-min-w-0 [overflow-wrap:anywhere]">
                          {formatDecimal(locale, level.unit_price)}
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className={
                            "tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-text-iron-600 tw-transition-transform group-hover:tw-text-iron-300 motion-reduce:tw-transition-none " +
                            (open ? "tw-rotate-180" : "")
                          }
                        />
                      </button>
                      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-text-iron-500 sm:tw-hidden">
                        <span>
                          {t(locale, "marketDepth.table.quantityShort")}{" "}
                          <span className="tw-tabular-nums tw-text-iron-300">
                            {formatInteger(locale, level.quantity)}
                          </span>
                        </span>
                        <span>
                          {t(locale, "marketDepth.table.cumulativeShort")}{" "}
                          <span className="tw-tabular-nums">
                            {formatInteger(locale, level.cumulative_quantity)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td
                      className={`${cellClass} tw-hidden tw-break-words tw-py-2.5 tw-text-sm tw-text-iron-300 sm:tw-table-cell sm:tw-px-3`}
                    >
                      {formatInteger(locale, level.quantity)}
                    </td>
                    <td
                      className={`${cellClass} tw-hidden tw-break-words tw-py-2.5 tw-pr-2.5 tw-text-meta tw-text-iron-500 sm:tw-table-cell sm:tw-pl-3`}
                    >
                      {formatInteger(locale, level.cumulative_quantity)}
                    </td>
                    {tradeActionsAvailable && (
                      <td
                        className={`${cellClass} tw-break-words tw-py-1 tw-pl-2 tw-pr-2.5 tw-align-middle`}
                      >
                        <MarketDepthLevelAction
                          order={singleOrder}
                          side={side}
                          locale={locale}
                          open={open}
                          panelId={panelId}
                          onClick={toggleDetails}
                        />
                      </td>
                    )}
                  </tr>
                  {tradeActionsAvailable && singleOrder && (
                    <MarketDepthOrderFeedback
                      order={singleOrder}
                      locale={locale}
                      tableRow
                    />
                  )}
                  <tr hidden={!open} data-market-depth-order-details={open}>
                    <td
                      colSpan={tradeActionsAvailable ? 4 : 3}
                      className="tw-px-0 tw-py-0 tw-text-left"
                    >
                      <div id={panelId} className="tw-px-4 sm:tw-px-5">
                        {open && (
                          <MarketDepthOrderDetails
                            orders={levelOrders}
                            expectedCount={level.order_count}
                            locale={locale}
                            isLoading={isLoading}
                            error={error}
                            onRetry={onLoadOrders}
                            onRefresh={onRefresh}
                            enableTradeActions={
                              tradeActionsAvailable && !singleOrder
                            }
                            focusedOrderHash={focusedOrderHash}
                            onOrderFocused={onOrderFocused}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {levels.length > MAX_LEVELS && (
        <button
          type="button"
          onClick={() => {
            if (focusedOrderHash) onOrderFocused?.();
            setShowAll((current) => !current);
          }}
          className="tw-font-inherit tw-mx-auto tw-mt-3 tw-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-transparent tw-px-[18px] tw-py-2 tw-text-meta tw-font-medium tw-text-iron-400 tw-transition-colors hover:tw-border-white/[0.16] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none sm:tw-min-h-[38px] sm:touch-only:tw-min-h-11"
        >
          {showAll
            ? t(locale, "marketDepth.levels.showFewer")
            : t(locale, "marketDepth.levels.showAll")}
        </button>
      )}
    </div>
  );
}
