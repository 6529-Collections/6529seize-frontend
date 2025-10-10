"use client";

import { useCallback, useEffect, useState } from "react";
import {
  XTDH_RECEIVED_VIEW_LABELS,
  type XtdhReceivedView,
} from "./utils/constants";
import {
  XtdhReceivedCollectionsUserView,
  XtdhReceivedNftsUserView,
} from "./subcomponents";

export interface XtdhReceivedSectionProps {
  readonly profileId: string | null;
}

export function XtdhReceivedSection({
  profileId,
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
        <XtdhReceivedCollectionsUserView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
        />
      ) : (
        <XtdhReceivedNftsUserView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
        />
      )}
    </section>
  );
}

export default XtdhReceivedSection;
