"use client";

import { useMemo } from "react";

import type {
  XtdhReceivedCollectionsViewState,
  XtdhReceivedNftsViewState,
} from "./subcomponents";
import {
  XtdhReceivedCollectionsView,
  XtdhReceivedNftsView,
} from "./subcomponents";
import {
  XTDH_RECEIVED_VIEW_LABELS,
  type XtdhReceivedView,
} from "./utils/constants";

export interface XtdhReceivedSectionProps {
  readonly view: XtdhReceivedView;
  readonly onViewChange: (view: XtdhReceivedView) => void;
  readonly collectionsState: XtdhReceivedCollectionsViewState;
  readonly nftsState: XtdhReceivedNftsViewState;
  readonly description?: string;
}

export function XtdhReceivedSection({
  view,
  onViewChange,
  collectionsState,
  nftsState,
  description = "View NFTs you hold that are currently receiving xTDH grants. Use the filters to explore by collection or individual token.",
}: XtdhReceivedSectionProps) {
  const announcement = useMemo(
    () => `${XTDH_RECEIVED_VIEW_LABELS[view]} view selected`,
    [view],
  );

  return (
    <section
      className="tw-flex tw-flex-col tw-gap-4"
      role="region"
      aria-label="Received xTDH"
    >
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">{description}</p>
      {view === "collections" ? (
        <XtdhReceivedCollectionsView
          view={view}
          onViewChange={onViewChange}
          announcement={announcement}
          state={collectionsState}
        />
      ) : (
        <XtdhReceivedNftsView
          view={view}
          onViewChange={onViewChange}
          announcement={announcement}
          state={nftsState}
        />
      )}
    </section>
  );
}

export default XtdhReceivedSection;
