import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function DiscoverPage() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <ExploreWavesSection
        title="Active discussions you are not yet following"
        subtitle={null}
        limit={20}
        endpoint="waves-overview/hot"
        viewAllHref={null}
      />
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: "Discovery",
    description: "Active discussions you are not yet following",
  });
}
