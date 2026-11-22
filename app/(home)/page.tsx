import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import HomePageContent from "@/components/home/HomePageContent";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildHomePageJsonLd } from "@/lib/structured-data/site";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";

export default function Page() {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <JsonLdScript data={buildHomePageJsonLd()} />
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
  const description = t(DEFAULT_LOCALE, "home.meta.description");

  return {
    ...metadata,
    description,
    openGraph: {
      ...metadata.openGraph,
      description,
    },
  };
}
