'use client';

import clsx from "clsx";

import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import {
  formatXtdhRate,
  formatXtdhTotal,
  getRateChangeDelta,
} from "../utils";

export interface XtdhReceivedCollectionCardMetricsProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly className?: string;
}

function getDeltaChipClasses(trend: "positive" | "negative" | "neutral") {
  if (trend === "positive") {
    return "tw-border-success/40 tw-bg-success/10 tw-text-success";
  }

  if (trend === "negative") {
    return "tw-border-error/40 tw-bg-error/10 tw-text-error";
  }

  return "tw-border-iron-700 tw-bg-iron-850 tw-text-iron-200";
}

/**
 * Displays aggregated collection metrics including rate, received total, and optional delta chip.
 */
export function XtdhReceivedCollectionCardMetrics({
  collection,
  className,
}: XtdhReceivedCollectionCardMetricsProps) {
  const delta = getRateChangeDelta(collection.rateChange7d);
  const deltaLabel =
    delta?.trend === "positive"
      ? "increased"
      : delta?.trend === "negative"
        ? "decreased"
        : "no change";

  return (
    <div
      className={clsx(
        "tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-3 sm:tw-gap-x-8",
        className,
      )}
    >
      <div className="tw-flex tw-min-w-[150px] tw-flex-col tw-gap-1">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
          xTDH Rate
        </span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {formatXtdhRate(collection.totalXtdhRate)}
          </span>
          {delta && (
            <CustomTooltip content="Change over last 7 days" placement="top">
              <span
                className={clsx(
                  "tw-inline-flex tw-items-center tw-justify-center tw-gap-1 tw-rounded-full tw-border tw-px-2 tw-py-0.5 tw-text-xxs tw-font-semibold tw-leading-none",
                  getDeltaChipClasses(delta.trend),
                )}
                aria-hidden="true"
              >
                {delta.trend === "positive" && "▲"}
                {delta.trend === "negative" && "▼"}
                {delta.trend === "neutral" && "–"}
                <span>{delta.percentageLabel}</span>
              </span>
            </CustomTooltip>
          )}
        </div>
        {delta && (
          <span className="tw-sr-only">
            xTDH rate has {deltaLabel} by {delta.percentageLabel} over the last 7
            days.
          </span>
        )}
      </div>
      <div className="tw-flex tw-min-w-[150px] tw-flex-col tw-gap-1">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
          Received
        </span>
        <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
          {formatXtdhTotal(collection.totalXtdhReceived)}
        </span>
      </div>
    </div>
  );
}
