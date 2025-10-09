"use client";

import { useCallback, useEffect, useState } from "react";
import {
  VIEW_LABELS,
  type ReceivedView,
} from "./user-page-xtdh-received/constants";
import {
  UserPageXtdhReceivedCollectionsView,
  UserPageXtdhReceivedNftsView,
} from "./user-page-xtdh-received/subcomponents";

export default function UserPageXtdhReceived({
  profileId,
}: {
  readonly profileId: string | null;
}) {
  const [view, setView] = useState<ReceivedView>("collections");
  const [announcement, setAnnouncement] = useState<string>(
    `${VIEW_LABELS.collections} view selected`
  );

  useEffect(() => {
    setAnnouncement(`${VIEW_LABELS[view]} view selected`);
  }, [view]);

  const handleViewChange = useCallback((next: ReceivedView) => {
    setView(next);
  }, []);

  return (
    <section
      className="tw-flex tw-flex-col tw-gap-4"
      role="region"
      aria-label="Received xTDH"
    >
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        View NFTs you hold that are currently receiving xTDH grants. Use the
        filters to explore by collection or individual token.
      </p>
      {view === "collections" ? (
        <UserPageXtdhReceivedCollectionsView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
        />
      ) : (
        <UserPageXtdhReceivedNftsView
          profileId={profileId}
          view={view}
          onViewChange={handleViewChange}
          announcement={announcement}
        />
      )}
    </section>
  );
}
