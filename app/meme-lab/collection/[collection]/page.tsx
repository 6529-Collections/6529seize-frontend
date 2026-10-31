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
import type { DBResponse } from "@/entities/IDBResponse";
import type { LabExtendedData } from "@/entities/INFT";
import { t } from "@/i18n/messages";
import { fetchUrl } from "@/services/6529api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type MemeLabCollectionResolution = "published" | "missing" | "unavailable";

// Collections are named by the URL, so a successful, well-formed empty result
// is the only "missing" signal. A failed request or a malformed payload is
// "unavailable" and keeps rendering so the client page can retry.
const resolveMemeLabCollection = cache(
  async (collectionName: string): Promise<MemeLabCollectionResolution> => {
    if (collectionName.length === 0) {
      return "missing";
    }

    try {
      const response = await fetchUrl<DBResponse<LabExtendedData>>(
        `${publicEnv.API_ENDPOINT}/api/lab_extended_data?collection=${encodeURIComponent(collectionName)}&page_size=1`,
        { cache: "no-store" }
      );
      const data: unknown = (response as { data?: unknown } | null)?.data;
      if (!Array.isArray(data)) {
        return "unavailable";
      }
      return data.length === 0 ? "missing" : "published";
    } catch (error) {
      console.warn("Failed to resolve Meme Lab collection", {
        collectionName,
        error,
      });
      return "unavailable";
    }
  }
);

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
  if ((await resolveMemeLabCollection(collectionName)) === "missing") {
    notFound();
  }

  return (
    <main className={styles["main"]} lang={locale}>
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
  if ((await resolveMemeLabCollection(collectionName)) === "missing") {
    notFound();
  }
  return getAppMetadata({
    title: t(locale, "memeLab.collections.documentTitle", {
      collectionName,
    }),
    description: t(locale, "memeLab.description.collections"),
    ogImage: `${publicEnv.BASE_ENDPOINT}/meme-lab.jpg`,
    twitterCard: "summary",
  });
}
