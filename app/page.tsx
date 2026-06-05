import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import HomePageContent from "@/components/home/HomePageContent";
import type { Metadata } from "next";

const ROOT_PAGE_DESCRIPTION = "Building a decentralized network state";

export default function Page() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <HomePageContent />
    </main>
  );
}

export function generateMetadata(): Metadata {
  const metadata = getAppMetadata({
    ogImage: `${publicEnv.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });

  return {
    ...metadata,
    description: ROOT_PAGE_DESCRIPTION,
    openGraph: {
      ...metadata.openGraph,
      description: ROOT_PAGE_DESCRIPTION,
    },
  };
}
