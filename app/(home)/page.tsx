import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import HomePageContent from "@/components/home/HomePageContent";
import HomeHeroSeed from "@/components/home/now-minting/HomeHeroSeed";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildHomePageJsonLd } from "@/lib/structured-data/site";
import type { Metadata } from "next";
import { connection } from "next/server";
import { startHomeHeroData } from "./home-hero-data.server";

const ROOT_PAGE_DESCRIPTION =
  "Building a decentralized network state: a decentralized, permissionless global network that funds, builds, and coordinates public-goods work across art, science, culture, and technology.";

export default async function Page() {
  // The hero data is per request: never request it while prerendering.
  await connection();

  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <JsonLdScript data={buildHomePageJsonLd()} />
      {/* Not awaited: the page streams now and the data follows it. */}
      <HomeHeroSeed data={startHomeHeroData()} />
      <HomePageContent />
    </main>
  );
}

export function generateMetadata(): Metadata {
  const metadata = getAppMetadata(
    {
      ogImage: `${publicEnv.BASE_ENDPOINT}/6529io-banner.png`,
      twitterCard: "summary_large_image",
    },
    { canonicalPath: "/" }
  );

  return {
    ...metadata,
    description: ROOT_PAGE_DESCRIPTION,
    openGraph: {
      ...metadata.openGraph,
      description: ROOT_PAGE_DESCRIPTION,
    },
  };
}
