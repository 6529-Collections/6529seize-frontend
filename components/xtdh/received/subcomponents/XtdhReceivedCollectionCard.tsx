'use client';

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { XtdhReceivedCollectionCardContent } from "./XtdhReceivedCollectionCardContent";
import { XtdhReceivedCollectionCardHeader } from "./XtdhReceivedCollectionCardHeader";

export interface XtdhReceivedCollectionCardProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export function XtdhReceivedCollectionCard({
  collection,
  expanded,
  onToggle,
}: XtdhReceivedCollectionCardProps) {
  return (
    <div
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      role="listitem"
    >
      <XtdhReceivedCollectionCardHeader
        collection={collection}
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <XtdhReceivedCollectionCardContent collection={collection} />
      )}
    </div>
  );
}
