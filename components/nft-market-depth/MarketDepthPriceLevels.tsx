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

const MAX_LEVELS = 5;

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
}) {
  const [showAll, setShowAll] = useState(false);
  const [openPrice, setOpenPrice] = useState<string | null>(null);
  const tradeActionsAvailable = useMarketDepthTradeActionsAvailable();
  const priceWidth = tradeActionsAvailable
    ? "tw-w-[64%] sm:tw-w-[40%]"
    : "tw-w-full sm:tw-w-[38%]";
  const quantityWidth = tradeActionsAvailable ? "tw-w-[16%]" : "tw-w-[31%]";
  const totalWidth = tradeActionsAvailable ? "tw-w-[16%]" : "tw-w-[31%]";
  const disclosureId = useId();
  const visibleLevels = showAll ? levels : levels.slice(0, MAX_LEVELS);
  const label = t(
    locale,
    side === "ask" ? "marketDepth.asks" : "marketDepth.bids"
  );

  return (
    <div className="tw-min-w-0">
      <div className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-white/10">
        <table className="tw-w-full tw-table-fixed tw-border-collapse tw-text-right tw-text-meta tw-leading-5">
          <caption className="tw-sr-only">
            {t(locale, "marketDepth.table.ariaLabel", {
              side: label,
              currency: currencyLabel,
            })}
          </caption>
          <thead className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-text-xs tw-font-normal tw-text-iron-400 [&_th]:tw-font-normal">
            <tr>
              <th
                scope="col"
                className={`${priceWidth} tw-px-0 tw-py-2.5 tw-text-left sm:tw-pr-3`}
              >
                {t(locale, "marketDepth.table.price")}
              </th>
              <th
                scope="col"
                aria-label={t(locale, "marketDepth.table.quantity")}
                className={`${quantityWidth} tw-hidden tw-py-2.5 sm:tw-table-cell sm:tw-px-3`}
              >
                {t(locale, "marketDepth.table.quantityShort")}
              </th>
              <th
                scope="col"
                aria-label={t(locale, "marketDepth.table.cumulative")}
                className={`${totalWidth} tw-hidden tw-px-0 tw-py-2.5 sm:tw-table-cell sm:tw-pl-3`}
              >
                {t(locale, "marketDepth.table.cumulativeShort")}
              </th>
              {tradeActionsAvailable && (
                <th scope="col" className="tw-w-[36%] tw-py-2.5 sm:tw-w-[28%]">
                  <span className="tw-sr-only">
                    {t(locale, "marketDepth.table.action")}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleLevels.map((level) => {
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
                setOpenPrice(open ? null : level.unit_price);
                if (!open) onLoadOrders();
              };
              return (
                <Fragment key={level.unit_price}>
                  <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/5">
                    <td className="tw-px-0 tw-py-0 tw-text-left sm:tw-pr-3">
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
                        className="tw-font-inherit tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-left tw-text-meta tw-font-medium tw-tabular-nums tw-text-iron-100 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400"
                      >
                        <span className="tw-min-w-0 [overflow-wrap:anywhere]">
                          {formatDecimal(locale, level.unit_price)}
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className={
                            "tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-text-iron-500 tw-transition-transform motion-reduce:tw-transition-none " +
                            (open ? "tw-rotate-180" : "")
                          }
                        />
                      </button>
                      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-text-iron-400 sm:tw-hidden">
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
                    <td className="tw-hidden tw-break-words tw-px-0 tw-py-2.5 tw-tabular-nums tw-text-iron-300 sm:tw-table-cell sm:tw-px-3">
                      {formatInteger(locale, level.quantity)}
                    </td>
                    <td className="tw-hidden tw-break-words tw-px-0 tw-py-2.5 tw-tabular-nums tw-text-iron-400 sm:tw-table-cell sm:tw-pl-3">
                      {formatInteger(locale, level.cumulative_quantity)}
                    </td>
                    {tradeActionsAvailable && (
                      <td className="tw-break-words tw-py-1 tw-pl-3 tw-align-top sm:tw-align-middle">
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
                  <tr hidden={!open}>
                    <td
                      colSpan={tradeActionsAvailable ? 4 : 3}
                      className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-px-0 tw-py-0 tw-text-left"
                    >
                      <div id={panelId} className="tw-pl-3 sm:tw-pl-4">
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
          onClick={() => setShowAll((current) => !current)}
          className="tw-font-inherit tw-mt-2 tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-meta tw-font-medium tw-text-iron-300 tw-transition hover:tw-bg-white/5 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {showAll
            ? t(locale, "marketDepth.levels.showFewer")
            : t(locale, "marketDepth.levels.showAll")}
        </button>
      )}
    </div>
  );
}
