import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import HomePageContent from "@/components/home/HomePageContent";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildHomePageJsonLd } from "@/lib/structured-data/site";
import type { Metadata } from "next";
import { getHomeArtworkStartupScript } from "@/lib/home-artwork/startup-script";
import { getApiBase } from "@/services/api/api-endpoints";

const ROOT_PAGE_DESCRIPTION =
  "Building a decentralized network state: a decentralized, permissionless global network that funds, builds, and coordinates public-goods work across art, science, culture, and technology.";

export default function Page() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <JsonLdScript data={buildHomePageJsonLd()} />
      <script
        id="home-artwork-startup"
        dangerouslySetInnerHTML={{
          __html: getHomeArtworkStartupScript({
            apiBase: getApiBase(),
            memesWaveOverride: publicEnv.DEV_MODE_MEMES_WAVE_ID,
            useDevAuth: publicEnv.USE_DEV_AUTH === "true",
          }),
        }}
      />
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
