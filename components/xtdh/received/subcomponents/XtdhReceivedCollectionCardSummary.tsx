'use client';

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

export interface XtdhReceivedCollectionCardSummaryProps {
  readonly collection: XtdhReceivedCollectionSummary;
}

/**
 * Renders the collection preview details inside the card header.
 */
export function XtdhReceivedCollectionCardSummary({
  collection,
}: XtdhReceivedCollectionCardSummaryProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <img
        src={collection.collectionImage}
        alt={`${collection.collectionName} artwork`}
        className="tw-h-14 tw-w-14 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
        loading="lazy"
      />
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-base tw-font-semibold tw-text-iron-50">
          {collection.collectionName}
        </span>
        <span className="tw-text-xs tw-text-iron-300">
          {collection.tokenCount.toLocaleString()} tokens receiving xTDH
        </span>
      </div>
    </div>
  );
}
