'use client';

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { formatXtdhRate, formatXtdhTotal } from "../utils";
import { XtdhReceivedGranterAvatarGroup } from "./XtdhReceivedGranterAvatarGroup";

export interface XtdhReceivedCollectionCardMetricsProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly expanded: boolean;
}

/**
 * Displays aggregated collection metrics alongside the granter avatars.
 */
export function XtdhReceivedCollectionCardMetrics({
  collection,
  expanded,
}: XtdhReceivedCollectionCardMetricsProps) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
          Total xTDH Rate
        </span>
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatXtdhRate(collection.totalXtdhRate)}
        </span>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
          Total Received
        </span>
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatXtdhTotal(collection.totalXtdhReceived)}
        </span>
      </div>
      <XtdhReceivedGranterAvatarGroup granters={collection.granters} />
      <span
        className="tw-ml-auto tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-850 tw-text-sm tw-text-iron-200"
        aria-hidden
      >
        {expanded ? "−" : "+"}
      </span>
    </div>
  );
}
