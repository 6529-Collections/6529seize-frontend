import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { isHomeDropClientFixtureEnabled } from "@/config/serverEnv";
import HomePageContent from "@/components/home/HomePageContent";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildHomePageJsonLd } from "@/lib/structured-data/site";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getInitialHomeDrop } from "./homeDrop.server";

export default async function Page() {
  await connection();
  const initialDrop = isHomeDropClientFixtureEnabled()
    ? null
    : await getInitialHomeDrop();

  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black">
      <JsonLdScript data={buildHomePageJsonLd()} />
      <HomePageContent initialDrop={initialDrop} />
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
