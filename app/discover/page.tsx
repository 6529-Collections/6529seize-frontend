import { getAppMetadata } from "@/components/providers/metadata";
import { DiscoverWaveExplorer } from "@/components/waves/discovery/DiscoverWaveExplorer";
import type { Metadata } from "next";
import { Suspense } from "react";

function DiscoverFallback() {
  return (
    <div
      role="status"
      aria-label="Loading waves"
      className="tw-px-4 tw-py-10 md:tw-px-6 md:tw-py-16 lg:tw-px-8"
    >
      <div className="tw-mx-auto tw-h-8 tw-max-w-xl tw-rounded-md tw-bg-iron-900" />
      <div className="tw-mt-8 tw-grid tw-grid-cols-1 tw-gap-x-3 tw-gap-y-4 sm:tw-grid-cols-2 sm:tw-gap-6 lg:tw-grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="tw-h-64 tw-rounded-xl tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-white/10"
          />
        ))}
      </div>
      <span className="tw-sr-only">Loading waves</span>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <Suspense fallback={<DiscoverFallback />}>
        <DiscoverWaveExplorer />
      </Suspense>
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "Discovery",
    description: "Active discussions you are not yet following",
  });
}
