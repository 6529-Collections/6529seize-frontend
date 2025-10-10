'use client';

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { getXtdhReceivedCollectionToggleLabel } from "./XtdhReceivedCollectionCard.constants";
import { XtdhReceivedCollectionCardMetrics } from "./XtdhReceivedCollectionCardMetrics";
import { XtdhReceivedCollectionCardSummary } from "./XtdhReceivedCollectionCardSummary";

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
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={getXtdhReceivedCollectionToggleLabel(collection.collectionName)}
      className="tw-w-full tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-left tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-600"
    >
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
        <XtdhReceivedCollectionCardSummary collection={collection} />
        <XtdhReceivedCollectionCardMetrics
          collection={collection}
          expanded={expanded}
        />
      </div>
    </button>
  );
}
