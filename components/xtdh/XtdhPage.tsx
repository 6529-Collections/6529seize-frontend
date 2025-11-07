"use client";

import XtdhReceivedSection from "./received";

const RECEIVED_DESCRIPTION =
  "Explore live xTDH allocations across the network. Data is loaded directly from the public API without mocks.";

export default function XtdhPage() {
  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-pb-16">
      <XtdhReceivedSection scope={{ kind: "ecosystem" }} description={RECEIVED_DESCRIPTION} />
    </div>
  );
}
