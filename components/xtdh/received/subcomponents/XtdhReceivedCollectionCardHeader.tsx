'use client';

import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import {
  getCollectionActivitySnapshot,
  getCollectionGrantorCount,
  getUpdatedRelativeMetadata,
} from "../utils";
import { getXtdhReceivedCollectionToggleLabel } from "./XtdhReceivedCollectionCard.constants";
import { XtdhReceivedCollectionCardMetrics } from "./XtdhReceivedCollectionCardMetrics";
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
  const screenReaderText = [
    activitySnapshot.screenReader,
    updatedMetadata ? `Last updated ${updatedMetadata.timeAgo}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const chevronClass = clsx(
    "tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900/70 tw-text-iron-300 tw-transition tw-duration-200 tw-ease-out group-hover:tw-text-iron-200 group-focus-visible:tw-text-iron-100",
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={getXtdhReceivedCollectionToggleLabel(collection.collectionName)}
      className="tw-group tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-2xl tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-left tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-900/60 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
    >
      <XtdhReceivedCollectionCardSummary collection={collection} className="tw-order-1" />
      <XtdhReceivedCollectionCardMetrics
        collection={collection}
        className="tw-order-2"
      />
      <div className="tw-order-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3 md:tw-gap-4">
        <XtdhReceivedGranterAvatarGroup
          granters={collection.granters}
          totalCount={getCollectionGrantorCount(collection)}
        />
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-3 md:tw-gap-4 tw-rounded-full tw-bg-iron-900/0 tw-px-2 tw-py-1 tw-transition tw-duration-200 tw-ease-out group-hover:tw-bg-iron-900/40 group-focus-visible:tw-bg-iron-900/40">
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
          <span className={chevronClass} aria-hidden="true">
            <FontAwesomeIcon
              icon={faChevronRight}
              className={clsx(
                "tw-h-3 tw-w-3 tw-transition-transform tw-duration-200",
                expanded ? "tw-rotate-90" : "tw-rotate-0",
              )}
            />
          </span>
        </div>
      </div>
    </button>
  );
}
