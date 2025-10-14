'use client';

import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import {
  formatXtdhRate,
  formatXtdhTotal,
  getCollectionActivitySnapshot,
  getCollectionGrantorCount,
  getRateChangeDelta,
  getUpdatedRelativeMetadata,
} from "../utils";
import { getXtdhReceivedCollectionToggleLabel } from "./XtdhReceivedCollectionCard.constants";
import { XtdhReceivedCollectionCardSummary } from "./XtdhReceivedCollectionCardSummary";
import { XtdhReceivedGranterAvatarGroup } from "./XtdhReceivedGranterAvatarGroup";

export interface XtdhReceivedCollectionCardHeaderProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

/**
 * Clickable header that exposes the collection summary and metrics.
 */
export function XtdhReceivedCollectionCardHeader({
  collection,
  expanded,
  onToggle,
}: XtdhReceivedCollectionCardHeaderProps) {
  const activitySnapshot = getCollectionActivitySnapshot(collection);
  const updatedMetadata = getUpdatedRelativeMetadata(
    collection.lastAllocatedAt ?? collection.lastUpdatedAt,
  );
  const delta = getRateChangeDelta(collection.rateChange7d);
  const deltaLabel =
    delta?.trend === "positive"
      ? "increased"
      : delta?.trend === "negative"
        ? "decreased"
        : "no change";
  const grantorCount = getCollectionGrantorCount(collection);
  const screenReaderText = [
    activitySnapshot.screenReader,
    updatedMetadata ? `Last updated ${updatedMetadata.timeAgo}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const actionLabel = "Expand";
  const actionIcon = faChevronDown;
  const actionPillClass = clsx(
    "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-iron-800/80 tw-bg-iron-900/40 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out",
    expanded
      ? "tw-border-primary-500/70 tw-bg-primary-500/10 tw-text-primary-200"
      : "group-hover:tw-border-iron-700 group-hover:tw-bg-iron-900/60 group-focus-visible:tw-border-primary-500 group-focus-visible:tw-bg-primary-500/10",
  );
  const metricLabelClass =
    "tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500";
  const metricValueClass =
    "tw-text-sm tw-font-semibold tw-text-iron-50 tw-tabular-nums";

  const deltaChipClass = delta
    ? clsx(
        "tw-inline-flex tw-items-center tw-justify-center tw-gap-1 tw-rounded-full tw-border tw-px-2 tw-py-0.5 tw-text-xxs tw-font-semibold tw-leading-none",
        delta.trend === "positive"
          ? "tw-border-success/30 tw-bg-success/5 tw-text-success"
          : delta.trend === "negative"
            ? "tw-border-error/30 tw-bg-error/5 tw-text-error"
            : "tw-border-iron-700 tw-bg-iron-850 tw-text-iron-200",
      )
    : undefined;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={getXtdhReceivedCollectionToggleLabel(collection.collectionName)}
      className="tw-group tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-2xl tw-bg-transparent tw-px-4 tw-py-3 tw-text-left tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-900/60 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
    >
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-3 md:tw-grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)]">
        <XtdhReceivedCollectionCardSummary
          collection={collection}
          className="tw-order-1 tw-min-w-0"
        />
        <div className="tw-order-2 tw-flex tw-flex-col tw-gap-1">
          <span className={metricLabelClass}>xTDH Rate</span>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className={metricValueClass}>
              {formatXtdhRate(collection.totalXtdhRate)}
            </span>
            {delta && (
              <span className={deltaChipClass} aria-hidden="true">
                {delta.trend === "positive" && "▲"}
                {delta.trend === "negative" && "▼"}
                {delta.trend === "neutral" && "–"}
                <span>{delta.percentageLabel}</span>
              </span>
            )}
          </div>
          {delta && (
            <span className="tw-sr-only">
              xTDH rate has {deltaLabel} by {delta.percentageLabel} over the last 7
              days.
            </span>
          )}
        </div>
        <div className="tw-order-3 tw-flex tw-flex-col tw-gap-1">
          <span className={metricLabelClass}>Received</span>
          <span className={metricValueClass}>
            {formatXtdhTotal(collection.totalXtdhReceived)}
          </span>
        </div>
        <div className="tw-order-4 tw-flex tw-flex-col tw-gap-1 tw-items-start md:tw-items-end">
          <span className={metricLabelClass}>Grantors</span>
          <XtdhReceivedGranterAvatarGroup
            granters={collection.granters}
            totalCount={grantorCount}
            showCountLabel
          />
        </div>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 md:tw-gap-3">
        {(activitySnapshot.desktop || updatedMetadata) && (
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-text-xs tw-leading-snug tw-text-iron-400">
            <span className="tw-min-w-0 tw-truncate tw-whitespace-nowrap">
              <span className="tw-hidden lg:inline">
                {activitySnapshot.desktop}
              </span>
              <span className="tw-hidden md:inline lg:hidden">
                {activitySnapshot.tablet}
              </span>
              <span className="tw-inline md:hidden">{activitySnapshot.mobile}</span>
            </span>
            {updatedMetadata && (
              <>
                <span aria-hidden="true" className="tw-text-iron-500/60">
                  -
                </span>
                <time
                  dateTime={updatedMetadata.datetime}
                  title={updatedMetadata.tooltip}
                  className="tw-flex-shrink-0 tw-text-xs tw-leading-snug tw-text-iron-400"
                >
                  {updatedMetadata.timeAgo}
                </time>
              </>
            )}
            {screenReaderText && (
              <span className="tw-sr-only">{screenReaderText}</span>
            )}
          </div>
        )}
        {!expanded && (
          <span className={clsx(actionPillClass, "tw-ml-auto")}>
            <span>{actionLabel}</span>
            <FontAwesomeIcon
              icon={actionIcon}
              className="tw-h-3 tw-w-3 tw-transition-transform tw-duration-200"
            />
          </span>
        )}
      </div>
    </button>
  );
}
