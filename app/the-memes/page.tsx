import styles from "@/styles/Home.module.css";

import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import TheMemesComponent from "@/components/the-memes/TheMemes";
import {
  getTheMemesRouteLocale,
  type TheMemesSearchParams,
} from "@/components/the-memes/theMemesRouteParams";
import { publicEnv } from "@/config/env";
import { t } from "@/i18n/messages";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildCollectionPageJsonLd } from "@/lib/structured-data/nft";
import { CC0_LICENSE_URL } from "@/lib/structured-data/utils";
import type { Metadata } from "next";
import { Suspense } from "react";

type TheMemesPageProps = {
  readonly searchParams?: Promise<TheMemesSearchParams>;
};

async function getRouteLocale(searchParams: TheMemesPageProps["searchParams"]) {
  return getTheMemesRouteLocale((await searchParams) ?? {});
}

export default async function TheMemesPage({
  searchParams,
}: TheMemesPageProps) {
  const locale = await getRouteLocale(searchParams);

  return (
    <main className={styles["main"]}>
      <JsonLdScript
        data={buildCollectionPageJsonLd({
          path: "/the-memes",
          name: "The Memes by 6529",
          description:
            "The Memes is the 6529 NFT collection of digital art cards.",
          image: `${publicEnv.BASE_ENDPOINT}/memes-preview.png`,
          license: CC0_LICENSE_URL,
        })}
      />
      <Suspense fallback={null}>
        <TheMemesComponent locale={locale} />
      </Suspense>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: TheMemesPageProps = {}): Promise<Metadata> {
  const locale = await getRouteLocale(searchParams);

  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: t(locale, "theMemes.documentTitle"),
      ogImage: getCollectionSocialCardImagePath("the-memes"),
      ogImageAlt: "The Memes collection social card",
      description: t(locale, "theMemes.description.collections"),
    })
  );
}
