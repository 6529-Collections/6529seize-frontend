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
    <article
      className="tw-flex tw-h-full tw-min-h-[220px] tw-flex-col tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-shadow-sm"
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
    </article>
  );
}
