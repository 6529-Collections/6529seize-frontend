"use client";

import dynamic from "next/dynamic";

const LatestActivity = dynamic(
  () => import("@/components/latest-activity/LatestActivity"),
  {
    ssr: false,
    loading: () => (
      <div className="pt-4" role="status" aria-live="polite" aria-busy="true">
        Loading latest activity…
      </div>
    ),
  }
);

export default LatestActivity;
