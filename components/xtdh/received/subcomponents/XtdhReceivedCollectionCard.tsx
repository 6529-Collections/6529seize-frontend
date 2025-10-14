'use client';

import clsx from "clsx";
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
      className={clsx(
        "tw-flex tw-h-full tw-flex-col tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-shadow-sm tw-transition tw-duration-200 tw-ease-out",
        expanded && "tw-border-primary-400/70 tw-shadow-lg tw-shadow-primary-900/40",
      )}
      role="listitem"
    >
      <XtdhReceivedCollectionCardHeader
        collection={collection}
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <XtdhReceivedCollectionCardContent
          collection={collection}
          onClose={onToggle}
        />
      )}
    </article>
  );
}
