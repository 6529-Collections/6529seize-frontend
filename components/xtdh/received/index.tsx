"use client";

import { useCallback, useEffect, useState } from "react";
import {
  XTDH_RECEIVED_VIEW_LABELS,
  type XtdhReceivedView,
} from "./utils/constants";
import {
  XtdhReceivedCollectionsView,
  XtdhReceivedNftsView,
} from "./subcomponents";

export interface XtdhReceivedSectionProps {
  readonly profileId: string | null;
  readonly granterHrefBuilder?: (profileId: string) => string;
}

export function XtdhReceivedSection({
  profileId,
  granterHrefBuilder,
}: XtdhReceivedSectionProps) {
  const [view, setView] = useState<XtdhReceivedView>("collections");
  const [announcement, setAnnouncement] = useState<string>(
    `${XTDH_RECEIVED_VIEW_LABELS.collections} view selected`
  );

  useEffect(() => {
    setAnnouncement(`${XTDH_RECEIVED_VIEW_LABELS[view]} view selected`);
  }, [view]);

  const handleViewChange = useCallback((next: XtdhReceivedView) => {
    setView(next);
  }, []);

  return (
    <section
      className="tw-flex tw-flex-col tw-gap-4"
      role="region"
      aria-label="Received xTDH"
    >
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        View NFTs you hold that are currently receiving xTDH grants. Use the filters
        to explore by collection or individual token.
      </p>
      {view === "collections" ? (
        <XtdhReceivedCollectionsView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
          granterHrefBuilder={granterHrefBuilder}
        />
      ) : (
        <XtdhReceivedNftsView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
          granterHrefBuilder={granterHrefBuilder}
        />
      )}
    </section>
  );
}

export default XtdhReceivedSection;
