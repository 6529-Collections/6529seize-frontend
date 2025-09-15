"use client";

import XTDHCard from "../ui/XTDHCard";

export default function XTDHHistory() {
  return (
    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
      <XTDHCard title="Outgoing (Grants)">
        <div className="tw-text-iron-300 tw-text-sm">No outgoing history in skeleton.</div>
      </XTDHCard>
      <XTDHCard title="Incoming (Received)">
        <div className="tw-text-iron-300 tw-text-sm">No incoming history in skeleton.</div>
      </XTDHCard>
    </div>
  );
}

