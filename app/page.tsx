import HomePageContent from "@/components/home/HomePageContent";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";

import type { Metadata } from "next";

export default function Page() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <HomePageContent />
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    ogImage: `${publicEnv.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
