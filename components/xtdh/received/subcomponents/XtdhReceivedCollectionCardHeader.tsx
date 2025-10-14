'use client';

import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import {
  formatTokensReceivingLabel,
  formatUpdatedRelativeLabel,
  getCollectionGrantorCount,
  getCollectionTokensReceiving,
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
  const tokenCount = getCollectionTokensReceiving(collection);
  const tokensLabel = formatTokensReceivingLabel(tokenCount);
  const sublineParts: string[] = [];

  if (collection.creatorName) {
    sublineParts.push(`By ${collection.creatorName}`);
  }

  sublineParts.push(tokensLabel);
  const subline = sublineParts.join(" • ");

  const updatedLabel = formatUpdatedRelativeLabel(
    collection.lastAllocatedAt ?? collection.lastUpdatedAt,
  );

  const chevronClass = clsx(
    "tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900 tw-text-iron-400 tw-transition tw-duration-200 tw-ease-out group-hover:tw-text-iron-200 group-focus-visible:tw-text-iron-100",
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={getXtdhReceivedCollectionToggleLabel(collection.collectionName)}
      className="tw-group tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-2xl tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-left tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-900/60 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
    >
      <XtdhReceivedCollectionCardSummary
        collection={collection}
        className="tw-order-1"
      />
      <XtdhReceivedCollectionCardMetrics
        collection={collection}
        className="tw-order-2 md:tw-order-3"
      />
      {subline && (
        <p className="tw-order-3 tw-text-xs tw-text-iron-400 tw-leading-snug md:tw-order-2">
          {subline}
        </p>
      )}
      <div className="tw-order-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3 md:tw-gap-4">
        <XtdhReceivedGranterAvatarGroup
          granters={collection.granters}
          totalCount={getCollectionGrantorCount(collection)}
        />
        <div className="tw-ml-auto tw-flex tw-items-center tw-gap-3 md:tw-gap-4">
          {updatedLabel && (
            <span className="tw-text-xs tw-leading-snug tw-text-iron-500">
              {updatedLabel}
            </span>
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
