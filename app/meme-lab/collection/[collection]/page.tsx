import styles from "@/styles/Home.module.css";

import MemeLabCollection from "@/components/memelab/MemeLabCollection";
import {
  getMemeLabCollectionName,
  getMemeLabRouteLocale,
  getSearchParamValue,
  type MemeLabCollectionSearchParams,
} from "@/components/memelab/memeLabRouteParams";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";

export default async function MemeLabCollectionPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ collection: string }>;
  readonly searchParams?: Promise<MemeLabCollectionSearchParams>;
}) {
  const { collection } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const locale = getMemeLabRouteLocale(resolvedSearchParams);
  const collectionName = getMemeLabCollectionName(collection);

  return (
    <main className={styles["main"]}>
      <MemeLabCollection
        collectionName={collectionName}
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
  params,
  searchParams,
}: {
  readonly params: Promise<{ collection: string }>;
  readonly searchParams?: Promise<MemeLabCollectionSearchParams>;
}): Promise<Metadata> {
  const { collection } = await params;
  const locale = getMemeLabRouteLocale((await searchParams) ?? {});
  const collectionName = getMemeLabCollectionName(collection);
  return getAppMetadata({
    title: t(locale, "memeLab.collections.documentTitle", {
      collectionName,
    }),
    description: t(locale, "memeLab.description.collections"),
    ogImage: `${publicEnv.BASE_ENDPOINT}/meme-lab.jpg`,
    twitterCard: "summary",
  });
}
