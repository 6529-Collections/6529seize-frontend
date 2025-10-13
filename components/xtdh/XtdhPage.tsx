"use client";

import XtdhStatsOverview from "./XtdhStatsOverview";
import XtdhReceivedSection from "./received";
import { useXtdhReceivedExplorer } from "./received/hooks";

const RECEIVED_DESCRIPTION =
  "Explore xTDH allocations across the ecosystem, switching between collection and token-level views as needed.";

export default function XtdhPage() {
  const { view, handleViewChange, collectionsState, nftsState } =
    useXtdhReceivedExplorer();

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-pb-16">
      <XtdhStatsOverview />
      <XtdhReceivedSection
        view={view}
        onViewChange={handleViewChange}
        collectionsState={collectionsState}
        nftsState={nftsState}
        description={RECEIVED_DESCRIPTION}
      />
    </div>
  );
}
