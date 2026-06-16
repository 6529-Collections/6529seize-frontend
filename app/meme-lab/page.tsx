import MemeLabComponent from "@/components/memelab/MemeLab";
import {
  getMemeLabRouteLocale,
  getSearchParamValue,
  type MemeLabListSearchParams,
} from "@/components/memelab/memeLabRouteParams";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { t } from "@/i18n/messages";
import JsonLdScript from "@/lib/structured-data/json-ld";
import { buildCollectionPageJsonLd } from "@/lib/structured-data/nft";
import { CC0_LICENSE_URL } from "@/lib/structured-data/utils";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default async function MemeLab({
  searchParams,
}: {
  readonly searchParams: Promise<MemeLabListSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = getMemeLabRouteLocale(resolvedSearchParams);

  return (
    <main className={styles["main"]}>
      <JsonLdScript
        data={buildCollectionPageJsonLd({
          path: "/meme-lab",
          name: "Meme Lab",
          description:
            "Meme Lab is a 6529 NFT collection connected to The Memes.",
          image: `${publicEnv.BASE_ENDPOINT}/meme-lab.jpg`,
          license: CC0_LICENSE_URL,
        })}
      />
      <MemeLabComponent
        initialSort={getSearchParamValue(resolvedSearchParams.sort)}
        initialSortDirection={getSearchParamValue(
          resolvedSearchParams.sort_dir
        )}
        locale={locale}
      />
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<MemeLabListSearchParams>;
}): Promise<Metadata> {
  const locale = getMemeLabRouteLocale(await searchParams);

  return getAppMetadata({
    title: t(locale, "memeLab.title"),
    ogImage: `${publicEnv.BASE_ENDPOINT}/meme-lab.jpg`,
    description: t(locale, "memeLab.description.collections"),
    twitterCard: "summary_large_image",
  });
}
