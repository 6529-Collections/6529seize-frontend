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
    <div className="tw-min-w-0 tw-@container [&_button]:tw-scroll-mb-40 [&_input]:tw-scroll-mb-40">
      <div className="tw-min-w-0">
        <table className="tw-w-full tw-table-fixed tw-border-separate tw-border-spacing-x-0 tw-border-spacing-y-1 tw-text-right tw-text-meta tw-leading-5">
          <caption className="tw-sr-only">
            {t(locale, "marketDepth.table.ariaLabel", {
              side: label,
              currency: currencyLabel,
            })}
          </caption>
          <thead className="tw-text-xs tw-normal-case tw-tracking-normal tw-text-iron-500 [&_th]:tw-h-0 [&_th]:tw-py-0 [&_th]:tw-font-medium sm:[&_th]:tw-h-6">
            <tr>
              <th
                scope="col"
                className={`${tradeActionsAvailable ? "tw-w-1/2" : "tw-w-full"} tw-pl-0 tw-text-left sm:tw-w-auto sm:tw-pl-5 sm:tw-pr-3`}
              >
                <span className="tw-sr-only sm:tw-not-sr-only">
                  {t(locale, "marketDepth.table.price")}
                </span>
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
                  className="tw-w-1/2 tw-pr-3 @2xl:tw-w-[120px] sm:tw-w-28 sm:tw-pr-2.5"
                >
                  <span className="tw-sr-only">
                    {t(locale, "marketDepth.table.action")}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleLevels.map((level, index) => {
              const best = index === 0;
              const cellClass = `tw-h-[60px] sm:tw-h-[54px] tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-tabular-nums tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${best ? "tw-bg-primary-500/[0.08]" : "tw-bg-transparent group-hover:tw-bg-white/[0.02]"}`;
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
                  <tr className="tw-group [&:has([aria-pressed=true])>td:first-child]:tw-rounded-bl-none [&:has([aria-pressed=true])>td:first-child]:tw-rounded-tl-xl [&:has([aria-pressed=true])>td:first-child]:tw-shadow-[inset_1px_0_0_theme(colors.iron.800),inset_0_1px_0_theme(colors.iron.800)] [&:has([aria-pressed=true])>td:last-child]:tw-rounded-br-none [&:has([aria-pressed=true])>td:last-child]:tw-rounded-tr-xl [&:has([aria-pressed=true])>td:last-child]:tw-shadow-[inset_-1px_0_0_theme(colors.iron.800),inset_0_1px_0_theme(colors.iron.800)] [&:has([aria-pressed=true])>td]:tw-border-b-transparent [&:has([aria-pressed=true])>td]:tw-bg-iron-900 [&:has([aria-pressed=true])>td]:tw-shadow-[inset_0_1px_0_theme(colors.iron.800)]">
                    <td
                      className={`${cellClass} ${best ? "tw-rounded-l-xl" : ""} ${best && !tradeActionsAvailable ? "tw-rounded-r-xl sm:tw-rounded-r-none" : ""} tw-py-0 tw-pl-0 tw-text-left sm:tw-pl-5 sm:tw-pr-3`}
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
                        className="tw-font-inherit tw-flex tw-min-h-[60px] tw-w-full tw-flex-col tw-items-start tw-justify-center tw-gap-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-py-2 tw-pl-3 tw-pr-0 tw-text-left tw-text-meta tw-font-medium tw-tabular-nums tw-text-iron-200 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 sm:tw-min-h-12 sm:tw-flex-row sm:tw-items-center sm:tw-justify-start sm:tw-gap-2 sm:tw-px-0"
                      >
                        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
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
                        </span>
                        <span className="tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500 sm:tw-hidden">
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
                        </span>
                      </button>
                    </td>
                    <td
                      className={`${cellClass} tw-hidden tw-break-words tw-py-2.5 tw-text-meta tw-text-iron-300 sm:tw-table-cell sm:tw-px-3`}
                    >
                      {formatInteger(locale, level.quantity)}
                    </td>
                    <td
                      className={`${cellClass} ${best && !tradeActionsAvailable ? "sm:tw-rounded-r-xl" : ""} tw-hidden tw-break-words tw-py-2.5 tw-pr-2.5 tw-text-meta tw-text-iron-500 sm:tw-table-cell sm:tw-pl-3`}
                    >
                      {formatInteger(locale, level.cumulative_quantity)}
                    </td>
                    {tradeActionsAvailable && (
                      <td
                        className={`${cellClass} ${best ? "tw-rounded-r-xl" : ""} tw-break-words tw-py-1 tw-pl-2 tw-pr-3 tw-align-middle sm:tw-pr-2.5`}
                      >
                        <MarketDepthLevelAction
                          order={singleOrder}
                          outlined={!best}
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
                      <div id={panelId} className="tw-px-0 sm:tw-px-5">
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
          className="tw-font-inherit tw-mx-auto tw-mt-3 tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-transparent tw-px-[18px] tw-py-2 tw-text-meta tw-font-medium tw-text-iron-400 tw-transition-colors hover:tw-border-white/[0.16] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none sm:tw-min-h-[38px] sm:tw-w-auto sm:touch-only:tw-min-h-11"
        >
          {showAll
            ? t(locale, "marketDepth.levels.showFewer")
            : t(locale, "marketDepth.levels.showAll")}
        </button>
      )}
    </div>
  );
}
